"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid2X2, LifeBuoy, MapPinned } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/field-app", label: "Hoje", icon: MapPinned },
  { href: "/field-app/chamados", label: "Chamados", icon: LifeBuoy },
  { href: "/field-app/mais", label: "Mais", icon: Grid2X2 }
] as const;

export function FieldAppBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/92 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_40px_-28px_rgba(15,23,42,0.35)] backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch gap-2 rounded-[1.8rem] bg-white/80 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 text-[11px] font-semibold transition-all duration-200",
                isActive
                  ? "bg-slate-950 text-white shadow-[0_14px_24px_-18px_rgba(15,23,42,0.85)]"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive ? <span className="absolute inset-x-6 top-1 h-1 rounded-full bg-emerald-300/80" /> : null}
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
