import type { Route } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { PortalAppTicketCard } from "@/components/portal-app/portal-app-ticket-card";
import { requirePortalUser } from "@/server/auth/session";
import { ticketService } from "@/server/services/ticket-service";

export default async function PortalAppTicketsPage() {
  const user = await requirePortalUser();
  const result = await ticketService.searchTickets({
    client: user.clientId,
    sort: "updated_desc"
  });

  const waitingCount = result.items.filter((ticket) => ticket.status === "WAITING_CUSTOMER").length;
  const openCount = result.items.filter((ticket) => !["CLOSED", "CANCELED"].includes(ticket.status)).length;

  return (
    <div className="space-y-5">
      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Suporte</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">Meus chamados</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Uma fila simples para acompanhar o atendimento no celular.</p>
          </div>
          <Link
            href={"/portal/chamados/novo" as Route}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm transition hover:bg-sky-700"
            aria-label="Novo chamado"
          >
            <Plus className="h-5 w-5" />
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-[1.4rem] bg-slate-50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Em andamento</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{openCount}</p>
          </div>
          <div className="rounded-[1.4rem] bg-amber-50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-amber-700">Aguardando você</p>
            <p className="mt-2 text-2xl font-semibold text-amber-950">{waitingCount}</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        {result.items.length > 0 ? (
          result.items.map((ticket) => <PortalAppTicketCard key={ticket.id} ticket={ticket} />)
        ) : (
          <div className="rounded-[1.8rem] border border-slate-200 bg-white px-4 py-8 text-center shadow-sm">
            <p className="font-semibold text-slate-700">Nenhum chamado encontrado</p>
            <p className="mt-1 text-sm text-slate-500">Abra um novo chamado quando precisar acionar o suporte.</p>
          </div>
        )}
      </section>
    </div>
  );
}
