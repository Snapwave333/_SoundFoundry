import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const ip = req.headers.get("x-forwarded-for") || req.ip || "unknown";
    const limit = rateLimit(`portal:${session.user.id}:${ip}`);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded", resetAt: limit.resetAt },
        { status: 429 }
      );
    }

    // Get Stripe customer ID
    const billingCustomer = await db.billingCustomer.findUnique({
      where: { userId: session.user.id },
    });

    if (!billingCustomer) {
      return NextResponse.json({ error: "No billing account found" }, { status: 404 });
    }

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: billingCustomer.stripeId,
      return_url: `${process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/app/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

