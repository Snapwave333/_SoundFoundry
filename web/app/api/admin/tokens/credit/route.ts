import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { creditTokens } from "@/lib/billing";
import { z } from "zod";

const creditSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().positive(),
  reason: z.string().min(1).optional().default("Manual credit"),
});

export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add RBAC check - only admins should access this
    // For now, we'll add a simple check
    const isAdmin = session.user.email?.endsWith("@promptbloom.app") || false; // Adjust based on your admin logic

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    // Validate request body
    const body = await req.json();
    const { userId, amount, reason } = creditSchema.parse(body);

    await creditTokens(userId, amount, {
      reason,
      source: "manual",
      meta: {
        adminUserId: session.user.id,
        adminEmail: session.user.email,
      },
    });

    return NextResponse.json({ success: true, message: `Credited ${amount} tokens to user ${userId}` });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: error.errors }, { status: 400 });
    }

    console.error("Error crediting tokens:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

