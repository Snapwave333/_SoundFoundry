"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchBalance(): Promise<{ balance: number }> {
  const res = await fetch("/api/tokens/balance");
  if (!res.ok) {
    throw new Error("Failed to fetch balance");
  }
  return res.json();
}

export function CurrentBalance() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["tokenBalance"],
    queryFn: fetchBalance,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="text-fg-muted animate-pulse">
        Loading balance...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-error">
        Error loading balance
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="text-sm text-fg-muted mb-1">Current Balance</div>
      <div className="text-4xl font-bold text-fg">
        {data?.balance.toLocaleString() || 0}
      </div>
      <div className="text-sm text-fg-muted mt-1">tokens</div>
    </div>
  );
}

