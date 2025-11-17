import Stripe from "stripe";

// Lazy initialization to avoid build-time errors
let _stripe: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
      typescript: true,
    });
  }
  return _stripe;
};

// Backward compatibility - lazy getter
export const stripe = new Proxy({} as Stripe, {
  get: (target, prop) => {
    const stripeInstance = getStripe();
    return (stripeInstance as Record<string, unknown>)[prop as string];
  },
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

// Token pack pricing (price IDs from Stripe)
export const TOKEN_PACKS = {
  starter: {
    priceId: process.env.STRIPE_PRICE_STARTER || "price_starter",
    tokens: 100,
    name: "Starter Pack",
  },
  pro: {
    priceId: process.env.STRIPE_PRICE_PRO || "price_pro",
    tokens: 500,
    name: "Pro Pack",
  },
  studio: {
    priceId: process.env.STRIPE_PRICE_STUDIO || "price_studio",
    tokens: 2000,
    name: "Studio Pack",
  },
} as const;

export type TokenPackKey = keyof typeof TOKEN_PACKS;

// Map price IDs to token amounts for webhook processing
export const TOKEN_MAP: Record<string, number> = {
  [TOKEN_PACKS.starter.priceId]: TOKEN_PACKS.starter.tokens,
  [TOKEN_PACKS.pro.priceId]: TOKEN_PACKS.pro.tokens,
  [TOKEN_PACKS.studio.priceId]: TOKEN_PACKS.studio.tokens,
};

// Map subscription price IDs to monthly token allocations
export const SUBSCRIPTION_PRICE_MAP: Record<string, number> = {
  price_basic_monthly: 50,
  price_pro_monthly: 200,
  price_studio_monthly: 1000,
};
