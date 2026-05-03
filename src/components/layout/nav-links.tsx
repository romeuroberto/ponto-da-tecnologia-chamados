"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  BarChart3,
  Building2,
  Users,
  Receipt,
  type LucideIcon
} from "lucide-react";

import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/chamados": Ticket,
  "/relatorios": BarChart3,
  "/clientes": Building2,
  "/usuarios": Users,
  "/financeiro": Receipt
};

interface NavItem {
  href: Route;
  label: string;
}

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-0.5 p-3">
      {items.map((item) => {
        const Icon = iconMap[item.href];
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
              isActive
                ? "bg-white/15 text-white shadow-sm"
                : "text-blue-200/70 hover:bg-white/8 hover:text-white"
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                isActive ? "bg-red-600 text-white shadow-sm" : "text-blue-200/60 group-hover:text-white"
              )}
            >
              {Icon && <Icon size={15} strokeWidth={2.2} />}
            </span>
            {item.label}
            {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-red-400" />}
          </Link>
        );
      })}
    </nav>
  );
}
