import type { Route } from "next";
import type { ReactNode } from "react";

import { FieldAppShell } from "@/components/field-app/field-app-shell";
import { requireRole } from "@/server/auth/session";

export default async function FieldAppLayout({ children }: { children: ReactNode }) {
  await requireRole(["TECHNICIAN"], "/field-app-login?callbackUrl=/field-app" as Route);

  return <FieldAppShell>{children}</FieldAppShell>;
}
