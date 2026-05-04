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
      <Card className="transition-colors hover:border-sky-200 hover:bg-sky-50/50">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{ticket.number}</p>
              <h3 className="mt-1 text-base font-semibold text-slate-950">{ticket.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{ticket.clientName}</p>
            </div>
            <PriorityBadge priority={ticket.priority} />
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={ticket.status} />
            <TicketSlaBadge ticket={ticket} />
          </div>
          <div className="text-sm text-slate-600">
            <p>Tipo: {getAttendanceTypeLabel(ticket.attendanceType)}</p>
            <p>Responsável: {ticket.assigneeName ?? "Não atribuído"}</p>
            <p>Atualizado: {formatDate(ticket.updatedAt)}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
