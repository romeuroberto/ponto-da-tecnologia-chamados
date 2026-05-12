import type { ReactNode } from "react";

import { PortalAppShell } from "@/components/portal-app/portal-app-shell";
import { requirePortalUser } from "@/server/auth/session";

export default async function PortalAppLayout({ children }: { children: ReactNode }) {
  await requirePortalUser();

  return <PortalAppShell>{children}</PortalAppShell>;
}
