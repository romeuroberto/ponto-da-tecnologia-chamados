"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
      onClick={() => signOut({ callbackUrl: "/login" })}
      type="button"
    >
      Sair
    </button>
  );
}
