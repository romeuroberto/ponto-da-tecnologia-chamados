import type { ReactNode } from "react";

import { PortalMobileNav } from "@/components/portal/portal-mobile-nav";
import { PortalSidebar } from "@/components/portal/portal-sidebar";
import { PortalTopbar } from "@/components/portal/portal-topbar";

export function PortalShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="flex min-h-screen">
        <PortalSidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <PortalTopbar />
          <PortalMobileNav />
          <main className="flex-1 px-4 pb-8 pt-6 lg:px-8 lg:pb-10 lg:pt-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
