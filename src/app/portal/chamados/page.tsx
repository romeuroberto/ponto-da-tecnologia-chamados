import type { Route } from "next";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
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

  const waitingCount = result.items.filter((t) => t.status === "WAITING_CUSTOMER").length;
  const resolvedCount = result.items.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length;

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Suporte</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Meus chamados</h1>
          <p className="mt-2 text-sm text-slate-500">Acompanhe o histórico, o status atual e as próximas interações do atendimento.</p>
        </div>
        <Link
          href={"/portal/chamados/novo" as Route}
          className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700 sm:w-auto"
        >
          Novo chamado
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Total</p>
          <p className="mt-2 text-2xl font-semibold text-sky-950">{result.total}</p>
          <p className="mt-1 text-sm text-sky-700">Chamados vinculados à sua empresa.</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Aguardando resposta</p>
          <p className="mt-2 text-2xl font-semibold text-amber-950">{waitingCount}</p>
          <p className="mt-1 text-sm text-amber-700">Respostas pendentes do seu time.</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Resolvidos</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-950">{resolvedCount}</p>
          <p className="mt-1 text-sm text-emerald-700">Chamados que já foram tratados.</p>
        </div>
      </div>

      {result.items.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {result.items.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/portal/chamados/${ticket.id}` as Route}
              className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-sky-200 hover:bg-sky-50/40"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{ticket.number}</p>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${portalTicketStatusClass[ticket.status]}`}>
                  {portalTicketStatusLabel[ticket.status]}
                </span>
              </div>

              <p className="mt-2 font-semibold text-slate-950">{ticket.title}</p>
              <p className="mt-1 text-sm text-slate-500">Aberto em {formatDate(ticket.createdAt)}</p>

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                <span className="text-slate-500">
                  Responsável: <span className="font-medium text-slate-700">{ticket.assigneeName ?? "Em definição"}</span>
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {portalPriorityLabel[ticket.priority]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="font-semibold text-slate-700">Nenhum chamado ainda</p>
            <p className="mt-1 text-sm text-slate-500">Clique em "Novo chamado" para abrir sua primeira solicitação.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
