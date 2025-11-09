import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { auditLog, getRequestMetadata, AuditActions } from "@/lib/audit";
import { z } from "zod";

const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  roleName: z.enum(["user", "creator", "developer", "admin"]),
});

export const POST = withRole(["admin"], async (req: NextRequest, session) => {
  try {
    const body = await req.json();
    const { userId, roleName } = assignRoleSchema.parse(body);
    const { ip, userAgent } = await getRequestMetadata();

    // Get role
    const role = await db.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if role already assigned
    const existing = await db.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Role already assigned" }, { status: 400 });
    }

    // Assign role
    await db.userRole.create({
      data: {
        userId,
        roleId: role.id,
      },
    });

    // Audit log
    await auditLog({
      userId: session.user.id,
      action: AuditActions.ROLE_ASSIGNED,
      metadata: {
        targetUserId: userId,
        roleName,
        targetUserEmail: user.email,
      },
      ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: `Role '${roleName}' assigned to ${user.email}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    console.error("Role assignment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

