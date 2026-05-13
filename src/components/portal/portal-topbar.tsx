import { auth } from "@/auth";
import { BrandMark } from "@/components/layout/brand-mark";
import { PortalSignOutButton } from "@/components/portal/portal-sign-out-button";
import Link from "next/link";

export async function PortalTopbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl px-3 py-1.5 lg:hidden" style={{ backgroundColor: "#1B2D5E" }}>
          <BrandMark />
        </div>
        <div className="hidden lg:flex lg:flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Portal do cliente</p>
          <p className="text-sm font-medium text-slate-600">Relacionamento, financeiro e suporte em um só lugar</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/portal-app?portal_view=app"
          className="hidden h-10 items-center justify-center rounded-xl border border-slate-200 px-3.5 text-sm font-semibold text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 sm:inline-flex"
        >
          Modo app
        </Link>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-800">{user?.name ?? "Cliente"}</p>
          <p className="text-xs text-slate-400">{user?.email ?? "Acesso autenticado"}</p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: "#1B2D5E" }}>
          {user?.name?.charAt(0).toUpperCase() ?? "C"}
        </div>
        <PortalSignOutButton />
      </div>
    </header>
  );
}
