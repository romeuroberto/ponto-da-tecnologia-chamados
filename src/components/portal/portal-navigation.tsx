"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, ScrollText, ShoppingBag, Wrench } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/portal/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/portal/chamados", label: "Chamados", icon: Wrench },
  { href: "/portal/financeiro", label: "Financeiro", icon: Receipt },
  { href: "/portal/vendas", label: "Vendas", icon: ShoppingBag },
  { href: "/portal/documentos", label: "Documentos", icon: ScrollText }
] as const;

export function PortalNavigation() {
  const pathname = usePathname();

  return (
    <>
      <nav className="hidden gap-2 overflow-x-auto pb-1 lg:flex">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex min-w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-sky-500 bg-sky-600 text-white"
                  : "border-white/15 bg-white/80 text-slate-700 hover:border-sky-200 hover:bg-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/96 px-2 py-2 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-stretch justify-between gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition-colors",
                  isActive ? "bg-sky-600 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
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
    </>
  );
}
