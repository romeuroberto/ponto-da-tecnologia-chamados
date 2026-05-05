import type { ReactNode } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";

import { auth } from "@/auth";
import { PortalNavigation } from "@/components/portal/portal-navigation";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const isLoggedIn = session?.user?.role === "CLIENT";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-950 p-2 text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Portal do Cliente</p>
                <p className="font-semibold leading-tight text-slate-950">Ponto da Tecnologia</p>
              </div>
            </div>

            {isLoggedIn ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="hidden text-slate-600 sm:block">{session.user.name}</span>
                <form action="/api/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Sair
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/portal"
                className="inline-flex h-9 items-center rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Acessar portal
              </Link>
            )}
          </div>

          {isLoggedIn ? (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <PortalNavigation />
            </div>
          ) : null}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 pb-24 lg:py-8 lg:pb-8">{children}</main>
    </div>
  );
}
