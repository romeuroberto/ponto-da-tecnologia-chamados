import Link from "next/link";

import { auth } from "@/auth";
import { PortalSignOutButton } from "@/components/portal/portal-sign-out-button";

export async function PortalAppTopbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/92 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">Portal app</p>
          <p className="truncate text-sm font-semibold text-slate-950">{user?.name ?? "Cliente"}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/portal/dashboard?portal_view=full"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
          >
            Portal completo
          </Link>
          <PortalSignOutButton callbackUrl="/portal?callbackUrl=/portal-app&portal_view=app" />
        </div>
      </div>
    </header>
  );
}
