"use client";

import { signOut } from "next-auth/react";

export function PortalSignOutButton() {
  return (
    <button
      type="button"
      className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-3.5 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
      onClick={() => signOut({ callbackUrl: "/portal" })}
    >
      Sair
    </button>
  );
}
