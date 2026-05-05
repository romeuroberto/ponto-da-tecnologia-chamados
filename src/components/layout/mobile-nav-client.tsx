"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import type { NavigationItem } from "@/components/layout/navigation-config";
import { NavLinks } from "@/components/layout/nav-links";
import { cn } from "@/lib/utils";

function findCurrentLabel(pathname: string, items: NavigationItem[]) {
  for (const item of items) {
    const child = item.children?.find((entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`));
    if (child) {
      return child.label;
    }

    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return item.label;
    }
  }

  return "Menu";
}

export function MobileNavClient({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const currentLabel = useMemo(() => findCurrentLabel(pathname, items), [items, pathname]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <div className="border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Navegação</p>
            <p className="truncate text-sm font-semibold text-slate-900">{currentLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
            aria-expanded={isOpen}
            aria-controls="mobile-app-drawer"
          >
            <Menu className="h-4 w-4" />
            Menu
          </button>
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/45 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setIsOpen(false)}
      />

      <aside
        id="mobile-app-drawer"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[88vw] max-w-xs flex-col bg-[#1B2D5E] shadow-2xl transition-transform duration-200 lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <BrandMark />
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <NavLinks items={items} />
        </div>

        <div className="border-t border-white/10 px-4 py-4">
          <Link
            href="/chamados"
            className="flex h-11 items-center justify-center rounded-xl bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Ir para chamados
          </Link>
        </div>
      </aside>
    </>
  );
}
