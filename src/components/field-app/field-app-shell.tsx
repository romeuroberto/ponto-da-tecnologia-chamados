import type { ReactNode } from "react";

import { FieldAppBootSplash } from "@/components/field-app/field-app-boot-splash";
import { FieldAppBottomNav } from "@/components/field-app/field-app-bottom-nav";
import { FieldAppTopbar } from "@/components/field-app/field-app-topbar";
import { PortalAppConnectionBanner } from "@/components/portal-app/portal-app-connection-banner";
import { PortalAppServiceWorker } from "@/components/portal-app/portal-app-service-worker";

export function FieldAppShell({ children }: { children: ReactNode }) {
  return (
    <div className="portal-app-shell min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#ecfdf5_100%)] text-slate-950">
      <PortalAppServiceWorker />
      <FieldAppBootSplash />
      <FieldAppTopbar />
      <PortalAppConnectionBanner />
      <main className="portal-app-scene mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-md flex-col px-4 pb-32 pt-5">
        {children}
      </main>
      <FieldAppBottomNav />
    </div>
  );
}
