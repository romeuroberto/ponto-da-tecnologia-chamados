import Link from "next/link";
import type { Route } from "next";

import { auth } from "@/auth";
import {
  canViewCatalogModule,
  canViewClientsModule,
  canViewFinancialModule,
  canViewSalesModule,
  canViewTicketsModule,
  canViewUsersModule
} from "@/server/auth/permissions";

const navigation: Array<{ href: Route; label: string }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/chamados", label: "Chamados" },
  { href: "/financeiro", label: "Financeiro" },
  { href: "/financeiro/cobrancas", label: "Cobrancas" },
  { href: "/financeiro/pagamentos", label: "Pagamentos" },
  { href: "/financeiro/documentos", label: "Documentos fiscais" },
  { href: "/empresa", label: "Empresa" },
  { href: "/vendas", label: "Vendas" },
  { href: "/estoque", label: "Estoque" },
  { href: "/relatorios", label: "Relatorios" },
  { href: "/clientes", label: "Clientes" },
  { href: "/usuarios", label: "Usuarios" },
  { href: "/catalogos/servicos", label: "Catalogo servicos" },
  { href: "/catalogos/pecas", label: "Catalogo pecas" }
];

export async function MobileNav() {
  const session = await auth();
  const role = session?.user?.role;

  const filteredNavigation = navigation.filter((item) => {
    if (!role) return false;
    if (item.href === "/chamados") return canViewTicketsModule(role);
    if (
      item.href === "/financeiro" ||
      item.href === "/financeiro/cobrancas" ||
      item.href === "/financeiro/pagamentos" ||
      item.href === "/financeiro/documentos"
    ) {
      return canViewFinancialModule(role);
    }
    if (item.href === "/relatorios") return canViewTicketsModule(role);
    if (item.href === "/clientes") return canViewClientsModule(role);
    if (item.href === "/usuarios") return canViewUsersModule(role);
    if (item.href === "/empresa") return role === "ADMIN";
    if (item.href === "/catalogos/servicos" || item.href === "/catalogos/pecas") return canViewCatalogModule(role);
    if (item.href === "/vendas" || item.href === "/estoque") return canViewSalesModule(role);
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
