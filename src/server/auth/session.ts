import type { Route } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import type { UserRole } from "@/types";

export async function getCurrentSession() {
  return auth();
}

export async function requireUser() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session.user;
}

export async function requireRole(roles: UserRole[], unauthenticatedRedirectTo?: Route) {
  const session = await auth();

  if (!session?.user) {
    redirect(unauthenticatedRedirectTo ?? "/login");
  }

  const user = session.user;

  if (!roles.includes(user.role)) {
    redirect("/dashboard");
  }

  return user;
}

export function hasRole(role: UserRole, roles: UserRole[]) {
  return roles.includes(role);
}

export async function requirePortalUser(redirectTo: Route = "/portal" as Route) {
  const session = await auth();

  if (!session?.user) {
    redirect(redirectTo);
  }

  if (session.user.role !== "CLIENT" || !session.user.clientId) {
    redirect("/dashboard" as Route);
  }

  return { ...session.user, clientId: session.user.clientId };
}
