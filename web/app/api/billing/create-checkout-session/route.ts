import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { ensureStripeCustomer } from "@/lib/billing";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const createCheckoutSchema = z.object({
  priceId: z.string().min(1),
  quantity: z.number().int().positive().optional().default(1),
});

export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const ip = req.headers.get("x-forwarded-for") || req.ip || "unknown";
    const limit = rateLimit(`billing:${session.user.id}:${ip}`);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded", resetAt: limit.resetAt },
        { status: 429 }
      );
    }

    // Validate request body
    const body = await req.json();
    const { priceId, quantity } = createCheckoutSchema.parse(body);

    // Determine mode (payment for one-time, subscription for recurring)
    const isSubscription = Object.keys(process.env)
      .filter((key) => key.startsWith("STRIPE_PRICE_SUBSCRIPTION_"))
      .some((key) => process.env[key] === priceId);

    const mode = isSubscription ? "subscription" : "payment";

    // Get or create Stripe customer
    const customerId = await ensureStripeCustomer(session.user.id, session.user.email);

    // Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode,
      line_items: [
        {
          price: priceId,
          quantity: quantity || 1,
        },
      ],
      success_url: `${process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/app/billing?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: process.env.BILLING_CANCEL_URL || `${process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/app/billing?canceled=1`,
      allow_promotion_codes: true,
      metadata: {
        userId: session.user.id,
        priceId,
      },
    };

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: error.errors }, { status: 400 });
    }

    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

