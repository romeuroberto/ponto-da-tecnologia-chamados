import type { Route } from "next";
import Link from "next/link";

import { portalPriorityLabel, portalTicketStatusClass, portalTicketStatusLabel } from "@/lib/portal";
import { formatDate } from "@/lib/utils";
import type { Ticket } from "@/types";

export function PortalAppTicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <Link
      href={`/portal-app/chamados/${ticket.id}` as Route}
      className="block rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-sky-200 hover:bg-sky-50/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{ticket.number}</p>
          <h2 className="mt-1 text-base font-semibold leading-6 text-slate-950">{ticket.title}</h2>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${portalTicketStatusClass[ticket.status]}`}>
          {portalTicketStatusLabel[ticket.status]}
        </span>
      </div>

      <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Atualizado</span>
          <span className="font-medium text-slate-900">{formatDate(ticket.updatedAt)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Prioridade</span>
          <span className="font-medium text-slate-900">{portalPriorityLabel[ticket.priority]}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Responsável</span>
          <span className="max-w-[60%] truncate text-right font-medium text-slate-900">{ticket.assigneeName ?? "Em definição"}</span>
        </div>
      </div>
    </Link>
  );
}
