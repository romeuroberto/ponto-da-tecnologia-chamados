import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { MapPinned, UserRound } from "lucide-react";

import { PriorityBadge } from "@/components/tickets/priority-badge";
import { StatusBadge } from "@/components/tickets/status-badge";
import { getAttendanceTypeLabel } from "@/lib/ticket-attendance";
import { formatDate } from "@/lib/utils";
import type { Ticket } from "@/types";

export function FieldAppTicketCard({
  ticket,
  href,
  footer,
  showPreview = false
}: {
  ticket: Ticket;
  href?: Route;
  footer?: ReactNode;
  showPreview?: boolean;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{ticket.number}</p>
          <h2 className="mt-1 text-base font-semibold leading-6 text-slate-950">{ticket.title}</h2>
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PriorityBadge priority={ticket.priority} />
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
          <MapPinned className="h-3.5 w-3.5" />
          {getAttendanceTypeLabel(ticket.attendanceType)}
        </span>
      </div>

      <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Cliente</span>
          <span className="max-w-[58%] truncate text-right font-medium text-slate-900">{ticket.clientName}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Atualizado</span>
          <span className="font-medium text-slate-900">{formatDate(ticket.updatedAt)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Solicitante</span>
          <span className="inline-flex max-w-[58%] items-center justify-end gap-1 truncate text-right font-medium text-slate-900">
            <UserRound className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {ticket.requesterName}
          </span>
        </div>
      </div>

      {showPreview ? (
        <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
          {ticket.category ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{ticket.category}</p>
          ) : null}
          <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-600">{ticket.description}</p>
        </div>
      ) : null}
    </>
  );

  return (
    <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/40">
      {href ? (
        <Link href={href} className="block">
          {content}
        </Link>
      ) : (
        content
      )}

      {footer ? <div className="mt-4 border-t border-slate-100 pt-4">{footer}</div> : null}
    </div>
  );
}
