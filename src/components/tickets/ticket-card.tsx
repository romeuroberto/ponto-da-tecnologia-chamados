import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { getAttendanceTypeLabel } from "@/lib/ticket-attendance";
import { formatDate } from "@/lib/utils";
import type { Ticket } from "@/types";
import { PriorityBadge } from "./priority-badge";
import { StatusBadge } from "./status-badge";
import { TicketSlaBadge } from "./ticket-sla-badge";

export function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <Link href={`/chamados/${ticket.id}`} className="block lg:hidden">
      <Card className="overflow-hidden transition-colors hover:border-sky-200 hover:bg-sky-50/50">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Chamado</p>
              <p className="text-sm font-semibold text-slate-950">{ticket.number}</p>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-sm">
              {getAttendanceTypeLabel(ticket.attendanceType)}
            </span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-base font-semibold leading-snug text-slate-950">{ticket.title}</h3>
              <p className="mt-1 truncate text-sm text-slate-600">{ticket.clientName}</p>
            </div>
            <PriorityBadge priority={ticket.priority} />
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge status={ticket.status} />
            <TicketSlaBadge ticket={ticket} />
          </div>

          <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
            <div className="flex items-start justify-between gap-3">
              <span className="text-slate-500">Responsável</span>
              <span className="text-right font-medium text-slate-900">{ticket.assigneeName ?? "Não atribuído"}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-slate-500">Atualizado</span>
              <span className="text-right font-medium text-slate-900">{formatDate(ticket.updatedAt)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <span className="text-sm font-semibold text-sky-700">Abrir chamado</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
