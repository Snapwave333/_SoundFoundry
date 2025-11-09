import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { auditLog, getRequestMetadata, AuditActions } from "@/lib/audit";
import { z } from "zod";

const removeRoleSchema = z.object({
  userId: z.string().uuid(),
  roleName: z.enum(["user", "creator", "developer", "admin"]),
});

export const POST = withRole(["admin"], async (req: NextRequest, session) => {
  try {
    const body = await req.json();
    const { userId, roleName } = removeRoleSchema.parse(body);
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

    // Remove role
    await db.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id,
        },
      },
    });

    // Audit log
    await auditLog({
      userId: session.user.id,
      action: AuditActions.ROLE_REMOVED,
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
      message: `Role '${roleName}' removed from ${user.email}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    console.error("Role removal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

