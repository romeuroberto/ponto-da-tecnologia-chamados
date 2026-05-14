import Link from "next/link";
import { CreditCard, ExternalLink, FileText, Receipt, ShieldCheck } from "lucide-react";

import { requirePortalUser } from "@/server/auth/session";

const entries = [
  {
    href: "/portal-app/financeiro",
    label: "Financeiro",
    detail: "Cobranças, pagamentos e instruções",
    icon: Receipt
  },
  {
    href: "/portal-app/documentos",
    label: "Documentos",
    detail: "Notas fiscais e comprovantes",
    icon: FileText
  },
  {
    href: "/portal-app/vendas",
    label: "Vendas",
    detail: "Histórico comercial e recibos",
    icon: CreditCard
  }
] as const;

export default async function PortalAppMorePage() {
  const user = await requirePortalUser("/portal-app-login?callbackUrl=/portal-app/mais&portal_view=app");

  return (
    <div className="space-y-5">
      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Conta</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">Mais opções</h1>
        <div className="mt-4 rounded-[1.4rem] bg-slate-50 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-950">{user.name}</p>
              <p className="truncate text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        {entries.map((entry) => {
          const Icon = entry.icon;

          return (
            <Link
              key={entry.href}
              href={entry.href}
              className="flex items-center gap-4 rounded-[1.6rem] border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:border-sky-200 hover:bg-sky-50/40"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-950">{entry.label}</p>
                <p className="text-sm text-slate-500">{entry.detail}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-slate-400" />
            </Link>
          );
        })}
      </section>
    </div>
  );
}
