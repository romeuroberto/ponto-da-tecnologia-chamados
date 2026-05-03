import Link from "next/link";
import type { Route } from "next";

import { auth } from "@/auth";
import { canViewClientsModule, canViewTicketsModule, canViewUsersModule } from "@/server/auth/permissions";

const navigation: Array<{ href: Route; label: string }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/chamados", label: "Chamados" },
  { href: "/relatorios", label: "Relatorios" },
  { href: "/clientes", label: "Clientes" },
  { href: "/usuarios", label: "Usuarios" }
];

export async function MobileNav() {
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
    <nav className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
      <div className="flex gap-2 overflow-x-auto">
        {filteredNavigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
