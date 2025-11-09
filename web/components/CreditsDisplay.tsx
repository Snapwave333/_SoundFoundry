"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Coins, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CreditsInfo {
  credits: number;
  plan: string;
  pricing_breakdown?: {
    credit_packs: Record<string, { credits: number; price: number }>;
  };
}

export function CreditsDisplay() {
  const [credits, setCredits] = useState<CreditsInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const data = await apiClient.getCredits();
        setCredits(data);
      } catch (error: any) {
        toast.error("Failed to load credits");
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCredits, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (!credits) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
        <Coins className="h-4 w-4" />
        <span className="text-sm font-medium">{credits.credits} credits</span>
      </div>
      {credits.credits < 10 && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            // TODO: Open purchase modal
            toast.info("Purchase credits feature coming soon");
          }}
        >
          Buy Credits
        </Button>
      )}
    </div>
  );
}

