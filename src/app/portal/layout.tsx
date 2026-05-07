import type { ReactNode } from "react";
import Link from "next/link";

import { auth } from "@/auth";
import { PortalShell } from "@/components/portal/portal-shell";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const isLoggedIn = session?.user?.role === "CLIENT";

  if (isLoggedIn) {
    return <PortalShell>{children}</PortalShell>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)]">
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Portal do cliente</p>
            <p className="mt-1 text-lg font-semibold text-slate-950">Ponto da Tecnologia</p>
          </div>
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
          >
            Área interna
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 pb-24 lg:py-12">{children}</main>
    </div>
  );
}
