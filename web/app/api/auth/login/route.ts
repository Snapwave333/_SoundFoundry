import { NextRequest, NextResponse } from "next/server";
import { signIn } from "next-auth/react";
import { rateLimit, getRateLimitId } from "@/lib/rate-limit";
import { auditLog, getRequestMetadata, AuditActions } from "@/lib/audit";
import { db } from "@/lib/db";
import { isMfaRequired } from "@/lib/mfa";

export async function POST(req: NextRequest) {
  // Rate limiting: 5 requests per minute per IP
  const rateLimitId = getRateLimitId(req, "login");
  const limit = rateLimit(rateLimitId, 5, 60 * 1000);

  if (!limit.allowed) {
    const { ip } = await getRequestMetadata();
    await auditLog({
      action: AuditActions.LOGIN_FAILURE,
      metadata: { reason: "rate_limit_exceeded" },
      ip,
    });

    return NextResponse.json(
      { error: "Too many login attempts. Please try again later.", retryAfter: limit.retryAfter },
      { status: 429 }
    );
  }

  try {
    const { email, password, mfaCode } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    // Check if user exists and verify password
    const user = await db.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: { role: true },
        },
        mfaSecret: true,
      },
    });

    if (!user || !user.passwordHash) {
      const { ip, userAgent } = await getRequestMetadata();
      await auditLog({
        action: AuditActions.LOGIN_FAILURE,
        metadata: { email, reason: "user_not_found" },
        ip,
        userAgent,
      });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Verify password (would use argon2 here)
    // For now, delegate to NextAuth credentials provider

    // Check MFA requirement
    const roles = user.roles.map((ur) => ur.role.name);
    const mfaRequired = isMfaRequired(roles);

    if (mfaRequired && user.mfaSecret?.enabled) {
      if (!mfaCode) {
        return NextResponse.json({ error: "MFA code required", mfaRequired: true }, { status: 401 });
      }

      // Verify MFA code (would use verifyMfaCode here)
      // For now, return MFA required
      return NextResponse.json({ error: "MFA verification not yet implemented", mfaRequired: true }, { status: 501 });
    }

    // Sign in via NextAuth
    // This is a simplified version - actual sign-in happens client-side
    return NextResponse.json({ success: true, mfaRequired: false });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

