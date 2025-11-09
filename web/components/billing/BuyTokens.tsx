"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const TOKEN_PACKS = [
  {
    id: process.env.NEXT_PUBLIC_STRIPE_PRICE_TOKENS_SMALL || "price_small",
    name: "Small Pack",
    tokens: 1000,
    price: "$9.99", // Update with actual prices from Stripe
  },
  {
    id: process.env.NEXT_PUBLIC_STRIPE_PRICE_TOKENS_MEDIUM || "price_medium",
    name: "Medium Pack",
    tokens: 5000,
    price: "$39.99",
  },
  {
    id: process.env.NEXT_PUBLIC_STRIPE_PRICE_TOKENS_LARGE || "price_large",
    name: "Large Pack",
    tokens: 12000,
    price: "$79.99",
  },
];

export function BuyTokens() {
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (priceId: string) => {
    setLoading(priceId);

    try {
      const res = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create checkout session");
      }

      const { url } = await res.json();

      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to start checkout");
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-fg">Buy Tokens</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {TOKEN_PACKS.map((pack) => (
          <div
            key={pack.id}
            className="border border-border rounded-lg p-6 bg-bg-elevated"
          >
            <h3 className="text-xl font-semibold text-fg mb-2">{pack.name}</h3>
            <div className="text-3xl font-bold text-accent mb-2">
              {pack.tokens.toLocaleString()} tokens
            </div>
            <div className="text-lg text-fg-muted mb-4">{pack.price}</div>
            <Button
              onClick={() => handlePurchase(pack.id)}
              disabled={loading === pack.id}
              className="w-full"
            >
              {loading === pack.id ? "Processing..." : "Buy Now"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

