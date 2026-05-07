import { Suspense } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { NavLinks } from "@/components/layout/nav-links";
import { portalNavigation } from "@/components/portal/portal-navigation-config";

export function PortalSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 lg:flex lg:flex-col" style={{ backgroundColor: "#1B2D5E" }}>
      <div className="border-b border-white/10 px-4 py-4">
        <BrandMark />
      </div>

      <div className="px-4 pt-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/90">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200/70">Portal do cliente</p>
          <p className="mt-1 text-sm font-medium text-white">Acompanhe chamados, financeiro, vendas e documentos.</p>
        </div>
      </div>

      <Suspense fallback={<div className="flex-1" />}>
        <NavLinks items={portalNavigation} />
      </Suspense>

      <div className="border-t border-white/10 px-4 py-3">
        <p className="text-[10px] font-medium uppercase tracking-widest text-blue-200/40">acesso do cliente</p>
      </div>
    </aside>
  );
}
