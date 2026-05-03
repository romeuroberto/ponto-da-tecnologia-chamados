import type { Route } from "next";

import { auth } from "@/auth";
import { BrandMark } from "@/components/layout/brand-mark";
import { NavLinks } from "@/components/layout/nav-links";
import { canViewClientsModule, canViewFinancialModule, canViewTicketsModule, canViewUsersModule } from "@/server/auth/permissions";

const navigation: Array<{ href: Route; label: string }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/chamados", label: "Chamados" },
  { href: "/relatorios", label: "Relatórios" },
  { href: "/clientes", label: "Clientes" },
  { href: "/usuarios", label: "Usuários" },
  { href: "/financeiro", label: "Financeiro" }
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
    if (item.href === "/financeiro") return canViewFinancialModule(role);
    return true;
  });

  return (
    <aside className="hidden w-64 shrink-0 lg:flex lg:flex-col" style={{ backgroundColor: "#1B2D5E" }}>
      <div className="border-b border-white/10 px-4 py-4">
        <BrandMark />
      </div>

      <NavLinks items={filteredNavigation} />

      <div className="border-t border-white/10 px-4 py-3">
        <p className="text-[10px] font-medium uppercase tracking-widest text-blue-200/40">v0.1.0 interno</p>
      </div>
    </aside>
  );
}
