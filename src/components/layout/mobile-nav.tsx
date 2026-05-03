import Link from "next/link";
import type { Route } from "next";

import { auth } from "@/auth";
import { canViewClientsModule, canViewFinancialModule, canViewTicketsModule, canViewUsersModule } from "@/server/auth/permissions";

const navigation: Array<{ href: Route; label: string }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/chamados", label: "Chamados" },
  { href: "/financeiro", label: "Financeiro" },
  { href: "/relatorios", label: "Relatórios" },
  { href: "/clientes", label: "Clientes" },
  { href: "/usuarios", label: "Usuários" }
];

export async function MobileNav() {
  const session = await auth();
  const role = session?.user?.role;
  const filteredNavigation = navigation.filter((item) => {
    if (!role) return false;
    if (item.href === "/chamados") return canViewTicketsModule(role);
    if (item.href === "/financeiro") return canViewFinancialModule(role);
    if (item.href === "/relatorios") return canViewTicketsModule(role);
    if (item.href === "/clientes") return canViewClientsModule(role);
    if (item.href === "/usuarios") return canViewUsersModule(role);
    return true;
  });

  return (
    <nav className="border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
      <div className="flex gap-1.5 overflow-x-auto">
        {filteredNavigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
