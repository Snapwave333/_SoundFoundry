import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import argon2 from "argon2";
import { z } from "zod";
import { rateLimit, getRateLimitId } from "@/lib/rate-limit";
import { auditLog, getRequestMetadata, AuditActions } from "@/lib/audit";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimitId = getRateLimitId(req, "signup");
  const limit = rateLimit(rateLimitId, 3, 60 * 1000); // 3 signups per minute

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter: limit.retryAfter },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { email, password, displayName } = signupSchema.parse(body);
    const { ip, userAgent } = await getRequestMetadata();

    // Check if user already exists
    const existing = await db.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password with Argon2id
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    // Create user
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        displayName: displayName || email.split("@")[0],
      },
    });

    // Assign default 'user' role
    const userRole = await db.role.findUnique({
      where: { name: "user" },
    });

    if (userRole) {
      await db.userRole.create({
        data: {
          userId: user.id,
          roleId: userRole.id,
        },
      });
    }

    // Audit log
    await auditLog({
      userId: user.id,
      action: AuditActions.SIGNUP,
      metadata: { email, displayName },
      ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

