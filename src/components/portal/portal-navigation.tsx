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
      {/* Desktop — barra inline no header */}
      <nav className="hidden gap-1 lg:flex">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile — bottom nav fixo */}
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
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold transition-colors",
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
    </>
  );
}
