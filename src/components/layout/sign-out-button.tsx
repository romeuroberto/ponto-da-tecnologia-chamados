"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
      onClick={() => signOut({ callbackUrl: "/login" })}
      type="button"
    >
      Sair
    </button>
  );
}
