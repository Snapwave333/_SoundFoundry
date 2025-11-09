"use client";

import { useQuery } from "@tanstack/react-query";

interface LedgerEntry {
  id: string;
  delta: number;
  reason: string;
  source: string;
  createdAt: string;
  meta?: Record<string, any>;
}

async function fetchLedger(limit: number = 20): Promise<LedgerEntry[]> {
  const res = await fetch(`/api/tokens/ledger?limit=${limit}`);
  if (!res.ok) {
    throw new Error("Failed to fetch ledger");
  }
  return res.json();
}

export function LedgerTable() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["tokenLedger"],
    queryFn: () => fetchLedger(20),
  });

  if (isLoading) {
    return <div className="text-fg-muted animate-pulse">Loading history...</div>;
  }

  if (error) {
    return <div className="text-error">Error loading history</div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-fg-muted">
        No transaction history yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-fg">Transaction History</h2>
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-bg-elevated">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-fg">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-fg">Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-fg">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-fg">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((entry) => (
              <tr key={entry.id} className="hover:bg-bg-elevated/50">
                <td className="px-4 py-3 text-sm text-fg-muted">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm text-fg-muted">{entry.source}</td>
                <td
                  className={`px-4 py-3 text-sm font-medium ${
                    entry.delta > 0 ? "text-success" : "text-error"
                  }`}
                >
                  {entry.delta > 0 ? "+" : ""}
                  {entry.delta.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-fg">{entry.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

