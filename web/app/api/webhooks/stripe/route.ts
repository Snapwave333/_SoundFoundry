import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import {
  creditTokens,
  upsertBillingCustomerFromStripe,
  inferRefundTokenAmount,
} from "@/lib/billing";
import { TOKEN_MAP, SUBSCRIPTION_PRICE_MAP } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // Get raw body
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Idempotency guard
  const alreadyProcessed = await db.tokenLedger.findUnique({
    where: { stripeEventId: event.id },
  });

  if (alreadyProcessed) {
    return NextResponse.json({ received: true, message: "Already processed" });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (!session.customer) break;

        const stripeCustomerId = typeof session.customer === "string" ? session.customer : session.customer.id;

        // Upsert billing customer
        const bc = await upsertBillingCustomerFromStripe(stripeCustomerId);

        // Handle one-time payment
        if (session.mode === "payment" && session.metadata?.priceId) {
          const priceId = session.metadata.priceId;
          const tokenPack = TOKEN_MAP[priceId];

          if (tokenPack) {
            await creditTokens(bc.userId, tokenPack.tokens, {
              reason: tokenPack.label,
              source: "stripe_checkout",
              stripeEventId: event.id,
              meta: {
                sessionId: session.id,
                priceId,
                amountTotal: session.amount_total,
              },
            });
          }
        }

        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;

        if (!invoice.customer) break;

        const stripeCustomerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer.id;
        const bc = await upsertBillingCustomerFromStripe(stripeCustomerId);

        // Get subscription price ID
        const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
        const priceId = invoice.lines?.data?.[0]?.price?.id;

        if (priceId) {
          const plan = SUBSCRIPTION_PRICE_MAP[priceId];

          if (plan) {
            await creditTokens(bc.userId, plan.monthlyTokens, {
              reason: plan.label,
              source: "stripe_invoice",
              stripeEventId: event.id,
              meta: {
                invoiceId: invoice.id,
                subscriptionId,
                priceId,
              },
            });
          }
        }

        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;

        if (!charge.customer) break;

        const stripeCustomerId = typeof charge.customer === "string" ? charge.customer : charge.customer.id;
        const bc = await upsertBillingCustomerFromStripe(stripeCustomerId);

        // Infer refund amount (conservative)
        const refundAmount = await inferRefundTokenAmount(charge);

        if (refundAmount > 0) {
          // Deduct tokens (but don't go below zero)
          const currentBalance = await db.tokenBalance.findUnique({
            where: { userId: bc.userId },
          });

          const deductAmount = Math.min(refundAmount, currentBalance?.balance || 0);

          if (deductAmount > 0) {
            await creditTokens(bc.userId, -deductAmount, {
              reason: "Refund adjustment",
              source: "stripe_refund",
              stripeEventId: event.id,
              meta: {
                chargeId: charge.id,
                refundAmount,
                deductedAmount: deductAmount,
              },
            });
          }
        }

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        // Handle subscription changes
        // For now, just log - future credits will stop on subscription.deleted
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription ${event.type}:`, subscription.id);
        break;
      }

      default:
        // Unknown event type - log but don't fail
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

