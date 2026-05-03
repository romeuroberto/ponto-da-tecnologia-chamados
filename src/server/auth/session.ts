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

export async function requireRole(roles: UserRole[]) {
  const user = await requireUser();

  if (!roles.includes(user.role)) {
    redirect("/dashboard");
  }

  return user;
}

export function hasRole(role: UserRole, roles: UserRole[]) {
  return roles.includes(role);
}
