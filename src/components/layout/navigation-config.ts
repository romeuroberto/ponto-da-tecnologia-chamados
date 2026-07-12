import type { Route } from "next";

import {
  canViewCatalogModule,
  canViewClientComputers,
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
  { href: "/chamados", label: "Chamados" },
  { href: "/acessos-remotos" as Route, label: "Acessos remotos" },
  {
    href: "/clientes",
    label: "Clientes",
    children: [
      { href: "/clientes", label: "Lista de clientes" },
      { href: "/clientes/contratos" as Route, label: "Contratos" }
    ]
  },
  {
    href: "/financeiro",
    label: "Financeiro",
    children: [
      { href: "/financeiro", label: "Visão geral" },
      { href: "/financeiro/clientes" as Route, label: "Por cliente" },
      { href: "/financeiro/despesas", label: "Despesas" },
      { href: "/financeiro/cobrancas", label: "Cobranças" },
      { href: "/financeiro/pagamentos", label: "Pagamentos" },
      { href: "/financeiro/documentos", label: "Documentos fiscais" }
    ]
  },
  {
    href: "/vendas",
    label: "Vendas",
    children: [
      { href: "/vendas", label: "Vendas" },
      { href: "/estoque", label: "Estoque" }
    ]
  },
  {
    href: "/locacoes" as Route,
    label: "Locações",
    children: [
      { href: "/locacoes" as Route, label: "Contratos" },
      { href: "/locacoes/equipamentos" as Route, label: "Equipamentos" }
    ]
  },
  { href: "/relatorios", label: "Relatórios" },
  {
    href: "/catalogos",
    label: "Catálogos",
    children: [
      { href: "/catalogos/servicos", label: "Serviços" },
      { href: "/catalogos/pecas", label: "Materiais" },
      { href: "/catalogos/categorias" as Route, label: "Categorias" }
    ]
  },
  { href: "/usuarios", label: "Usuários" },
  { href: "/empresa", label: "Empresa" }
];

export function filterNavigationByRole(items: NavigationItem[], role?: AppUser["role"]) {
  if (!role) {
    return [];
  }

  return items.filter((item) => {
    if (item.href === "/chamados") return canViewTicketsModule(role);
    if (item.href === ("/acessos-remotos" as Route)) return canViewClientComputers(role);
    if (item.href === "/clientes") return canViewClientsModule(role);
    if (item.href === "/usuarios") return canViewUsersModule(role);
    if (item.href === "/financeiro") return canViewFinancialModule(role);
    if (item.href === "/empresa") return role === "ADMIN";
    if (item.href === "/catalogos") return canViewCatalogModule(role);
    if (item.href === "/vendas") return canViewSalesModule(role);
    if (item.href === ("/locacoes" as Route)) return role === "ADMIN" || role === "ATTENDANT";
    return true;
  });
}
