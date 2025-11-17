import { prisma } from "@/lib/db";

export interface TokenBalance {
  balance: number;
  updatedAt: Date;
}

export interface LedgerEntry {
  id: string;
  userId: string;
  delta: number;
  reason: string;
  source: string;
  stripeEventId?: string | null;
  meta?: Record<string, unknown> | null;
  createdAt: Date;
}

export async function getTokenBalance(userId: string): Promise<number> {
  const balance = await prisma.tokenBalance.findUnique({
    where: { userId },
  });
  return balance?.balance ?? 0;
}

export async function creditTokens(
  userId: string,
  amount: number,
  reason: string,
  source: string,
  stripeEventId?: string,
  meta?: Record<string, unknown>
): Promise<void> {
  await prisma.$transaction([
    prisma.tokenLedger.create({
      data: {
        userId,
        delta: amount,
        reason,
        source,
        stripeEventId,
        meta: meta ?? undefined,
      },
    }),
    prisma.tokenBalance.upsert({
      where: { userId },
      update: {
        balance: { increment: amount },
      },
      create: {
        userId,
        balance: amount,
      },
    }),
  ]);
}

export async function debitTokens(
  userId: string,
  amount: number,
  reason: string,
  meta?: Record<string, unknown>
): Promise<boolean> {
  const balance = await getTokenBalance(userId);

  if (balance < amount) {
    return false;
  }

  await prisma.$transaction([
    prisma.tokenLedger.create({
      data: {
        userId,
        delta: -amount,
        reason,
        source: "consume",
        meta: meta ?? undefined,
      },
    }),
    prisma.tokenBalance.update({
      where: { userId },
      data: {
        balance: { decrement: amount },
      },
    }),
  ]);

  return true;
}

export async function getLedgerHistory(
  userId: string,
  limit: number = 50
): Promise<LedgerEntry[]> {
  const entries = await prisma.tokenLedger.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return entries.map((entry) => ({
    id: entry.id,
    userId: entry.userId,
    delta: entry.delta,
    reason: entry.reason,
    source: entry.source,
    stripeEventId: entry.stripeEventId,
    meta: entry.meta as Record<string, unknown> | null,
    createdAt: entry.createdAt,
  }));
}

// Aliases for backward compatibility
export const getBalance = getTokenBalance;
export const getLedger = getLedgerHistory;

export async function ensureStripeCustomer(userId: string): Promise<string> {
  const existing = await prisma.billingCustomer.findUnique({
    where: { userId },
  });

  if (existing) {
    return existing.stripeId;
  }

  // Import stripe here to avoid circular dependency
  const { stripe } = await import("@/lib/stripe");

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { userId },
  });

  await prisma.billingCustomer.create({
    data: {
      userId,
      stripeId: customer.id,
    },
  });

  return customer.id;
}

export async function upsertBillingCustomerFromStripe(
  userId: string,
  stripeCustomerId: string
): Promise<void> {
  await prisma.billingCustomer.upsert({
    where: { userId },
    update: { stripeId: stripeCustomerId },
    create: {
      userId,
      stripeId: stripeCustomerId,
    },
  });
}

export function inferRefundTokenAmount(
  amountRefunded: number,
  originalTokenAmount: number,
  originalAmount: number
): number {
  // Proportional refund calculation
  const refundRatio = amountRefunded / originalAmount;
  return Math.floor(originalTokenAmount * refundRatio);
}
