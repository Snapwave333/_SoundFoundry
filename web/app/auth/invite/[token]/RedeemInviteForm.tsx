"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  token: string;
  roleName: string;
}

export default function RedeemInviteForm({ token, roleName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRedeem = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/auth/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to redeem invite");
        setLoading(false);
        return;
      }

      toast.success(`Successfully joined as ${roleName}!`);
      router.push("/app");
      router.refresh();
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleRedeem}
        disabled={loading}
        className="w-full bg-resonance hover:bg-resonance/90 text-white"
      >
        {loading ? "Accepting..." : `Accept ${roleName} Invite`}
      </Button>
      <Button
        onClick={() => router.push("/app")}
        variant="outline"
        className="w-full bg-graphite/40 border-graphite text-steel hover:bg-graphite/60"
      >
        Cancel
      </Button>
    </div>
  );
}

