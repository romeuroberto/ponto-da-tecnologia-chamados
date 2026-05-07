import type { Route } from "next";

import {
  canViewCatalogModule,
  canViewClientsModule,
  canViewFinancialModule,
  canViewSalesModule,
  canViewTicketsModule,
  canViewUsersModule
} from "@/server/auth/permissions";
import type { AppUser } from "@/types";

export interface NavigationChild {
  href: Route;
  label: string;
}

export interface NavigationItem {
  href: Route;
  label: string;
  children?: NavigationChild[];
}

export const appNavigation: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  {
    href: "/chamados",
    label: "Chamados",
    children: [
      { href: "/chamados", label: "Todos" },
      { href: "/chamados?status=OPEN" as Route, label: "Em Aberto" },
      { href: "/chamados?status=WAITING_CUSTOMER" as Route, label: "Aguardando Cliente" },
      { href: "/chamados/novo", label: "Novo Chamado" },
      { href: "/relatorios", label: "Relatórios" }
    ]
  },
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
  { href: "/usuarios", label: "Usuários" },
  {
    href: "/catalogos",
    label: "Catálogos",
    children: [
      { href: "/catalogos/servicos", label: "Serviços" },
      { href: "/catalogos/pecas", label: "Materiais" },
      { href: "/catalogos/categorias" as Route, label: "Categorias" }
    ]
  }
];

export function filterNavigationByRole(items: NavigationItem[], role?: AppUser["role"]) {
  if (!role) {
    return [];
  }

  return items.filter((item) => {
    if (item.href === "/chamados") return canViewTicketsModule(role);
    if (item.href === "/clientes") return canViewClientsModule(role);
    if (item.href === "/usuarios") return canViewUsersModule(role);
    if (item.href === "/financeiro") return canViewFinancialModule(role);
    if (item.href === "/empresa") return role === "ADMIN";
    if (item.href === "/catalogos") return canViewCatalogModule(role);
    if (item.href === "/vendas") return canViewSalesModule(role);
    return true;
  });
}
