import type { ReactNode } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";

import { auth } from "@/auth";
import { PortalNavigation } from "@/components/portal/portal-navigation";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const isLoggedIn = session?.user?.role === "CLIENT";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_32%),linear-gradient(180deg,_#eef7ff_0%,_#f8fafc_42%,_#f8fafc_100%)]">
      <header className="border-b border-white/70 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-[1.25rem] bg-slate-950 p-3 text-white shadow-sm">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">Portal do Cliente</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">Ponto da Tecnologia</p>
                <p className="text-sm text-slate-500">Acompanhe chamados, vendas, cobranças e documentos em um só lugar.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              {isLoggedIn ? (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium">{session.user.name}</span>
                  <form action="/api/auth/signout" method="POST">
                    <button type="submit" className="rounded-full border border-slate-200 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50">
                      Sair
                    </button>
                  </form>
                </div>
              ) : (
                <Link href="/portal" className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Acessar portal
                </Link>
              )}
              {isLoggedIn ? <PortalNavigation /> : null}
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
