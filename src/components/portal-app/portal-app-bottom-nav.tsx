"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid2X2, LifeBuoy, PanelsTopLeft } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/portal-app", label: "Início", icon: PanelsTopLeft },
  { href: "/portal-app/chamados", label: "Chamados", icon: LifeBuoy },
  { href: "/portal-app/mais", label: "Mais", icon: Grid2X2 }
] as const;

export function PortalAppBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/96 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 text-[11px] font-semibold transition-colors",
                isActive ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
