"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ManageBilling() {
  const [loading, setLoading] = useState(false);

  const handleManage = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/billing/create-portal-session", {
        method: "POST",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create portal session");
      }

      const { url } = await res.json();

      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to open billing portal");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-fg">Manage Subscription</h2>
      <p className="text-fg-muted">
        Update your payment method, view invoices, and manage your subscription.
      </p>
      <Button onClick={handleManage} disabled={loading} className="w-full md:w-auto">
        {loading ? "Opening..." : "Manage Subscription & Payment Methods"}
      </Button>
    </div>
  );
}

