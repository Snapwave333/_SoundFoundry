import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export type Role = "admin" | "dev" | "pro" | "basic";

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  roles: string[];
}

// Alias for backward compatibility
export type SessionWithRoles = SessionUser;

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session?.user) return null;

  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name,
    roles: session.user.roles || [],
  };
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }
  return user;
}

export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await requireAuth();
  if (!user.roles.includes(role)) {
    redirect("/unauthorized");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  return requireRole("admin");
}

export async function requireDev(): Promise<SessionUser> {
  const user = await requireAuth();
  if (!user.roles.includes("admin") && !user.roles.includes("dev")) {
    redirect("/unauthorized");
  }
  return user;
}

export function hasRole(user: SessionUser | null, role: Role): boolean {
  if (!user) return false;
  return user.roles.includes(role);
}

export function hasAnyRole(user: SessionUser | null, roles: Role[]): boolean {
  if (!user) return false;
  return roles.some((role) => user.roles.includes(role));
}

export async function getUserRoles(userId: string): Promise<string[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return userRoles.map((ur) => ur.role.name);
}

export async function assignRole(userId: string, roleName: string): Promise<void> {
  const role = await prisma.role.findUnique({
    where: { name: roleName },
  });

  if (!role) {
    throw new Error(`Role ${roleName} not found`);
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      userId,
      roleId: role.id,
    },
  });
}

export async function removeRole(userId: string, roleName: string): Promise<void> {
  const role = await prisma.role.findUnique({
    where: { name: roleName },
  });

  if (!role) {
    throw new Error(`Role ${roleName} not found`);
  }

  await prisma.userRole.delete({
    where: {
      userId_roleId: {
        userId,
        roleId: role.id,
      },
    },
  });
}

// Higher-order function to wrap API routes with role checking
type ApiHandler = (
  req: NextRequest,
  session: SessionUser
) => Promise<NextResponse>;

export function withRole(requiredRole: Role, handler: ApiHandler) {
  return async function (req: NextRequest): Promise<NextResponse> {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user: SessionUser = {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.name,
      roles: session.user.roles || [],
    };

    if (!user.roles.includes(requiredRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return handler(req, user);
  };
}

export function withAnyRole(requiredRoles: Role[], handler: ApiHandler) {
  return async function (req: NextRequest): Promise<NextResponse> {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user: SessionUser = {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.name,
      roles: session.user.roles || [],
    };

    const hasRequiredRole = requiredRoles.some((role) =>
      user.roles.includes(role)
    );

    if (!hasRequiredRole) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return handler(req, user);
  };
}
