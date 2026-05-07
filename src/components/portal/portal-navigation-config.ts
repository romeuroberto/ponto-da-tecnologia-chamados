import type { Route } from "next";

import type { NavigationItem } from "@/components/layout/navigation-config";

export const portalNavigation: NavigationItem[] = [
  { href: "/portal/dashboard" as Route, label: "Dashboard" },
  { href: "/portal/chamados" as Route, label: "Chamados" },
  { href: "/portal/financeiro" as Route, label: "Financeiro" },
  { href: "/portal/vendas" as Route, label: "Vendas" },
  { href: "/portal/documentos" as Route, label: "Documentos" }
];
