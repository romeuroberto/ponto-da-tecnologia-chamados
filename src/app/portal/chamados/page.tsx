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
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Suporte</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Meus chamados</h1>
          <p className="mt-2 text-sm text-slate-500">Acompanhe o andamento dos atendimentos e veja o histórico de cada solicitação.</p>
        </div>
        <Link
          href={"/portal/chamados/novo" as Route}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Novo chamado
        </Link>
      </div>

      {result.items.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {result.items.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/portal/chamados/${ticket.id}` as Route}
              className="block rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-sky-200 hover:bg-sky-50/40"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{ticket.number}</p>
                  <p className="mt-2 text-lg font-semibold leading-snug text-slate-950">{ticket.title}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Aberto em {formatDate(ticket.createdAt)}
                    {ticket.assigneeName ? ` · Responsável: ${ticket.assigneeName}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${portalTicketStatusClass[ticket.status]}`}>
                    {portalTicketStatusLabel[ticket.status]}
                  </span>
                  <span className="text-xs font-medium text-slate-500">{portalPriorityLabel[ticket.priority]}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="font-semibold text-slate-700">Nenhum chamado ainda</p>
          <p className="mt-1 text-sm text-slate-500">Clique em "Novo chamado" para abrir sua primeira solicitação.</p>
        </div>
      )}
    </div>
  );
}
