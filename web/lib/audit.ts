import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export const AuditActions = {
  LOGIN_SUCCESS: "login_success",
  LOGIN_FAILURE: "login_failure",
  LOGOUT: "logout",
  SIGNUP: "signup",
  PASSWORD_CHANGE: "password_change",
  ROLE_ASSIGNED: "role_assigned",
  ROLE_REMOVED: "role_removed",
  INVITE_CREATED: "invite_created",
  INVITE_REDEEMED: "invite_redeemed",
  MFA_ENABLED: "mfa_enabled",
  MFA_DISABLED: "mfa_disabled",
  TOKEN_PURCHASE: "token_purchase",
  TOKEN_CREDIT: "token_credit",
  TOKEN_DEBIT: "token_debit",
  TRACK_CREATED: "track_created",
  TRACK_DELETED: "track_deleted",
  ADMIN_ACTION: "admin_action",
} as const;

export type AuditAction = (typeof AuditActions)[keyof typeof AuditActions];

export interface AuditLogEntry {
  action: AuditAction;
  userId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

export async function auditLog(entry: AuditLogEntry): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: entry.action,
      userId: entry.userId,
      metadata: entry.metadata ?? undefined,
      ip: entry.ip,
      userAgent: entry.userAgent,
    },
  });
}

export async function getRequestMetadata(): Promise<{
  ip: string;
  userAgent: string;
}> {
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0] ||
    headersList.get("x-real-ip") ||
    "unknown";
  const userAgent = headersList.get("user-agent") || "unknown";

  return { ip, userAgent };
}

export async function getAuditLogs(
  userId?: string,
  action?: AuditAction,
  limit: number = 100
) {
  return prisma.auditLog.findMany({
    where: {
      ...(userId && { userId }),
      ...(action && { action }),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
        },
      },
    },
  });
}
