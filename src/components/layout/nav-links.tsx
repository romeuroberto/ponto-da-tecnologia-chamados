"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  Building2,
  LayoutDashboard,
  Receipt,
  Settings2,
  Ticket,
  Users,
  type LucideIcon
} from "lucide-react";

import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/chamados": Ticket,
  "/relatorios": BarChart3,
  "/clientes": Building2,
  "/empresa": Settings2,
  "/usuarios": Users,
  "/financeiro": Receipt,
  "/catalogos": Boxes
};

interface NavChild {
  href: Route;
  label: string;
}

interface NavItem {
  href: Route;
  label: string;
  children?: NavChild[];
}

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-0.5 p-3">
      {items.map((item) => {
        const Icon = iconMap[item.href];
        const hasChildren = Boolean(item.children?.length);
        const selfActive = pathname === item.href || (!hasChildren && pathname.startsWith(`${item.href}/`));
        const childActive =
          item.children?.some((c) => pathname === c.href || pathname.startsWith(`${c.href}/`)) ?? false;
        const isActive = selfActive || childActive;

        return (
          <div key={item.href}>
            <Link
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
              {isActive && !hasChildren && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-red-400" />}
            </Link>

            {hasChildren ? (
              <div className="mb-1 ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                {item.children!.map((child) => {
                  const isChildActive = pathname === child.href || pathname.startsWith(`${child.href}/`);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "flex items-center rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                        isChildActive
                          ? "bg-white/10 text-white"
                          : "text-blue-200/50 hover:bg-white/8 hover:text-white"
                      )}
                    >
                      {child.label}
                      {isChildActive ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-red-400" /> : null}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
