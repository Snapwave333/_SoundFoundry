import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    // Find invite
    const invite = await db.invite.findUnique({
      where: { token },
      include: { role: true },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invalid invite token" }, { status: 404 });
    }

    if (invite.used) {
      return NextResponse.json({ error: "Invite already used" }, { status: 400 });
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 400 });
    }

    // Check if user already has this role
    const existingRole = await db.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: session.user.id,
          roleId: invite.roleId,
        },
      },
    });

    if (existingRole) {
      // Mark invite as used even if role already exists
      await db.invite.update({
        where: { token },
        data: { used: true },
      });

      return NextResponse.json({
        success: true,
        message: "Role already assigned",
        role: invite.role.name,
      });
    }

    // Assign role
    await db.userRole.create({
      data: {
        userId: session.user.id,
        roleId: invite.roleId,
      },
    });

    // Mark invite as used
    await db.invite.update({
      where: { token },
      data: { used: true },
    });

    return NextResponse.json({
      success: true,
      message: `Role '${invite.role.name}' assigned successfully`,
      role: invite.role.name,
    });
  } catch (error) {
    console.error("Redeem invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

