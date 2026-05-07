import { Suspense } from "react";

import { auth } from "@/auth";
import { BrandMark } from "@/components/layout/brand-mark";
import { appNavigation, filterNavigationByRole } from "@/components/layout/navigation-config";
import { NavLinks } from "@/components/layout/nav-links";

export async function Sidebar() {
  const session = await auth();
  const role = session?.user?.role;
  const filteredNavigation = filterNavigationByRole(appNavigation, role);

  return (
    <aside className="hidden w-64 shrink-0 lg:flex lg:flex-col" style={{ backgroundColor: "#1B2D5E" }}>
      <div className="border-b border-white/10 px-4 py-4">
        <BrandMark />
      </div>

      <Suspense fallback={<div className="flex-1" />}>
        <NavLinks items={filteredNavigation} />
      </Suspense>

      <div className="border-t border-white/10 px-4 py-3">
        <p className="text-[10px] font-medium uppercase tracking-widest text-blue-200/40">v0.1.0 interno</p>
      </div>
    </aside>
  );
}
