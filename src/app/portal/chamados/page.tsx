import type { Route } from "next";
import Link from "next/link";

import { portalPriorityLabel, portalTicketStatusClass, portalTicketStatusLabel } from "@/lib/portal";
import { formatDate } from "@/lib/utils";
import { requirePortalUser } from "@/server/auth/session";
import { ticketService } from "@/server/services/ticket-service";

export default async function PortalTicketsPage() {
  const user = await requirePortalUser();

  const result = await ticketService.searchTickets({
    client: user.clientId,
    sort: "updated_desc"
  });

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Suporte</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Meus chamados</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">Acompanhe o andamento dos atendimentos e veja o histórico de cada solicitação.</p>
        </div>
        <Link
          href={"/portal/chamados/novo" as Route}
          className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Novo chamado
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1.75rem] border border-sky-200 bg-sky-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Total</p>
          <p className="mt-2 text-3xl font-semibold text-sky-950">{result.total}</p>
          <p className="mt-1 text-sm text-sky-700">Chamados vinculados à sua empresa.</p>
        </div>
        <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Aguardando cliente</p>
          <p className="mt-2 text-3xl font-semibold text-amber-950">
            {result.items.filter((ticket) => ticket.status === "WAITING_CUSTOMER").length}
          </p>
          <p className="mt-1 text-sm text-amber-700">Respostas pendentes para o seu time.</p>
        </div>
        <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Resolvidos</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-950">
            {result.items.filter((ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED").length}
          </p>
          <p className="mt-1 text-sm text-emerald-700">Chamados que já passaram pela tratativa.</p>
        </div>
      </div>

      {result.items.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {result.items.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/portal/chamados/${ticket.id}` as Route}
              className="block rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-sky-200 hover:bg-sky-50/40 sm:p-5"
            >
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Chamado</p>
                  <p className="text-sm font-semibold text-slate-950">{ticket.number}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${portalTicketStatusClass[ticket.status]}`}>
                  {portalTicketStatusLabel[ticket.status]}
                </span>
              </div>

              <div className="mt-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-lg font-semibold leading-snug text-slate-950">{ticket.title}</p>
                  <p className="mt-2 text-sm text-slate-500">Aberto em {formatDate(ticket.createdAt)}</p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {portalPriorityLabel[ticket.priority]}
                </span>
              </div>

              <div className="mt-4 grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-500">Responsável</span>
                  <span className="text-right font-medium text-slate-900">{ticket.assigneeName ?? "Em definição"}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-500">Atualizado</span>
                  <span className="text-right font-medium text-slate-900">{formatDate(ticket.updatedAt)}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end">
                <span className="text-sm font-semibold text-sky-700">Ver detalhes</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <p className="font-semibold text-slate-700">Nenhum chamado ainda</p>
          <p className="mt-1 text-sm text-slate-500">Clique em "Novo chamado" para abrir sua primeira solicitação.</p>
        </div>
      )}
    </div>
  );
}
