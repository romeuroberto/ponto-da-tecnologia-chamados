import type { Route } from "next";

import { auth } from "@/auth";
import { BrandMark } from "@/components/layout/brand-mark";
import { NavLinks } from "@/components/layout/nav-links";
import {
  canViewCatalogModule,
  canViewClientsModule,
  canViewFinancialModule,
  canViewSalesModule,
  canViewTicketsModule,
  canViewUsersModule
} from "@/server/auth/permissions";

const navigation: Array<{ href: Route; label: string; children?: Array<{ href: Route; label: string }> }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/chamados", label: "Chamados" },
  {
    href: "/financeiro",
    label: "Financeiro",
    children: [
      { href: "/financeiro", label: "Visão geral" },
      { href: "/financeiro/cobrancas", label: "Cobranças" },
      { href: "/financeiro/pagamentos", label: "Pagamentos" },
      { href: "/financeiro/documentos", label: "Documentos fiscais" }
    ]
  },
  { href: "/empresa", label: "Empresa" },
  { href: "/clientes", label: "Clientes" },
  {
    href: "/vendas",
    label: "Vendas",
    children: [
      { href: "/vendas", label: "Vendas" },
      { href: "/estoque", label: "Estoque" }
    ]
  },
  { href: "/relatorios", label: "Relatórios" },
  { href: "/usuarios", label: "Usuários" },
  {
    href: "/catalogos",
    label: "Catálogos",
    children: [
      { href: "/catalogos/servicos", label: "Serviços" },
      { href: "/catalogos/pecas", label: "Peças" }
    ]
  }
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
    if (item.href === "/empresa") return role === "ADMIN";
    if (item.href === "/catalogos") return canViewCatalogModule(role);
    if (item.href === "/vendas") return canViewSalesModule(role);
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
