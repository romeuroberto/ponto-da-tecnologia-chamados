import Link from "next/link";
import type { Route } from "next";

import { auth } from "@/auth";
import { BrandMark } from "@/components/layout/brand-mark";
import { cn } from "@/lib/utils";
import { canViewClientsModule, canViewTicketsModule, canViewUsersModule } from "@/server/auth/permissions";

const navigation: Array<{ href: Route; label: string }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/chamados", label: "Chamados" },
  { href: "/relatorios", label: "Relatorios" },
  { href: "/clientes", label: "Clientes" },
  { href: "/usuarios", label: "Usuarios" }
];

export async function Sidebar() {
  const session = await auth();
  const role = session?.user?.role;
  const filteredNavigation = navigation.filter((item) => {
    if (!role) return false;
    if (item.href === "/chamados") return canViewTicketsModule(role);
    if (item.href === "/relatorios") return canViewTicketsModule(role);
    if (item.href === "/clientes") return canViewClientsModule(role);
    if (item.href === "/usuarios") return canViewUsersModule(role);
    return true;
  });

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-950 text-slate-100 lg:flex lg:flex-col">
      <div className="border-b border-slate-800 px-5 py-4">
        <BrandMark />
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {filteredNavigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn("rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white")}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
