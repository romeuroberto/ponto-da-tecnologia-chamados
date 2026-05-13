import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, CreditCard, FileText, LifeBuoy, Plus, Wallet } from "lucide-react";

import { PortalAppEmptyState } from "@/components/portal-app/portal-app-empty-state";
import { PortalAppTicketCard } from "@/components/portal-app/portal-app-ticket-card";
import { formatCurrency } from "@/lib/utils";
import { requirePortalUser } from "@/server/auth/session";
import { portalService } from "@/server/services/portal-service";

export default async function PortalAppHomePage() {
  const user = await requirePortalUser();
  const dashboard = await portalService.getDashboard(user.clientId);

  const shortcuts = [
    { href: "/portal-app/chamados/novo" as Route, label: "Novo chamado", detail: "Abrir uma solicitação", icon: Plus },
    { href: "/portal-app/financeiro" as Route, label: "Financeiro", detail: "Ver cobranças e pagamentos", icon: Wallet },
    { href: "/portal-app/documentos" as Route, label: "Documentos", detail: "Notas e comprovantes", icon: FileText },
    { href: "/portal-app/vendas" as Route, label: "Vendas", detail: "Histórico comercial", icon: CreditCard }
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-slate-950 px-5 py-6 text-white shadow-lg shadow-slate-950/10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200">Resumo do cliente</p>
        <h1 className="mt-2 text-2xl font-semibold">{dashboard.client?.name ?? "Portal do cliente"}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Acompanhe chamados, cobranças e documentos em uma navegação mais direta para celular.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-[1.4rem] bg-white/8 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">Chamados abertos</p>
            <p className="mt-2 text-2xl font-semibold">{dashboard.summary.openTickets}</p>
          </div>
          <div className="rounded-[1.4rem] bg-white/8 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">Em aberto</p>
            <p className="mt-2 text-2xl font-semibold">{formatCurrency(dashboard.summary.pendingAmount)}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3">
        {shortcuts.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 rounded-[1.6rem] border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:border-sky-200 hover:bg-sky-50/40"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-950">{item.label}</p>
                <p className="text-sm text-slate-500">{item.detail}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          );
        })}
      </section>

      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Chamados recentes</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Acompanhe o que está em andamento</h2>
          </div>
          <Link href={"/portal-app/chamados" as Route} className="text-sm font-semibold text-sky-700">
            Ver todos
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {dashboard.recentTickets.length > 0 ? (
            dashboard.recentTickets.map((ticket) => <PortalAppTicketCard key={ticket.id} ticket={ticket} />)
          ) : (
            <PortalAppEmptyState
              icon={LifeBuoy}
              title="Nenhum chamado ainda"
              description="Quando houver atendimento aberto, ele aparecerá aqui."
            />
          )}
        </div>
      </section>
    </div>
  );
}
