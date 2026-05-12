import type { ReactNode } from "react";

import { PortalAppBottomNav } from "@/components/portal-app/portal-app-bottom-nav";
import { PortalAppTopbar } from "@/components/portal-app/portal-app-topbar";

export function PortalAppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] text-slate-950">
      <PortalAppTopbar />
      <main className="mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-md flex-col px-4 pb-32 pt-5">
        {children}
      </main>
      <PortalAppBottomNav />
    </div>
  );
}
