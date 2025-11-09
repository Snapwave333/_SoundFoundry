"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CurrentBalance } from "@/components/billing/CurrentBalance";
import { BuyTokens } from "@/components/billing/BuyTokens";
import { ManageBilling } from "@/components/billing/ManageBilling";
import { LedgerTable } from "@/components/billing/LedgerTable";

export default function BillingPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    if (success === "1") {
      toast.success("Payment successful! Your tokens have been added.");
    }

    if (canceled === "1") {
      toast.info("Payment canceled. No charges were made.");
    }
  }, [searchParams]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-4xl font-bold text-fg mb-8">Billing & Tokens</h1>

      <div className="space-y-8">
        {/* Current Balance */}
        <div className="border border-border rounded-lg p-6 bg-bg-elevated">
          <CurrentBalance />
        </div>

        {/* Buy Tokens */}
        <BuyTokens />

        {/* Manage Billing */}
        <ManageBilling />

        {/* Transaction History */}
        <LedgerTable />
      </div>
    </div>
  );
}

