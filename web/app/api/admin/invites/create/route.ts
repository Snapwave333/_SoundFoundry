import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { auditLog, getRequestMetadata, AuditActions } from "@/lib/audit";
import { z } from "zod";
import { randomUUID } from "crypto";

const createInviteSchema = z.object({
  roleName: z.enum(["creator", "developer", "admin"]),
  expiresInDays: z.number().int().positive().max(90).optional().default(7),
});

export const POST = withRole(["admin"], async (req: NextRequest, session) => {
  try {
    const body = await req.json();
    const { roleName, expiresInDays } = createInviteSchema.parse(body);
    const { ip, userAgent } = await getRequestMetadata();

    // Get role
    const role = await db.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Create invite
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    await db.invite.create({
      data: {
        token,
        roleId: role.id,
        createdBy: session.user.id,
        expiresAt,
      },
    });

    // Audit log
    await auditLog({
      userId: session.user.id,
      action: AuditActions.INVITE_CREATED,
      metadata: {
        roleName,
        expiresInDays,
        expiresAt: expiresAt.toISOString(),
      },
      ip,
      userAgent,
    });

    const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://promptbloom.app";
    const redeemUrl = `${siteUrl}/auth/invite/${token}`;

    return NextResponse.json({
      success: true,
      token,
      redeemUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    console.error("Invite creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

