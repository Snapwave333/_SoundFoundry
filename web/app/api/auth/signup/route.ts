import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import argon2 from "argon2";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = signupSchema.parse(body);

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

