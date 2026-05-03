import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { TicketDetailActions } from "@/components/tickets/ticket-detail-actions";
import { TicketAttachments } from "@/components/tickets/ticket-attachments";
import { PriorityBadge } from "@/components/tickets/priority-badge";
import { StatusBadge } from "@/components/tickets/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { requireUser } from "@/server/auth/session";
import { ticketService } from "@/server/services/ticket-service";
import { userService } from "@/server/services/user-service";

export default async function TicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const currentUser = await requireUser();
  const { id } = await params;
  const [ticket, users] = await Promise.all([ticketService.getTicket(id), userService.listUsers()]);

  if (!ticket) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={ticket.title}
        description={`${ticket.number} - ${ticket.clientName}`}
        action={
          <div className="flex flex-wrap gap-2">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados do chamado</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cliente</p>
                <p className="mt-1 text-sm text-slate-900">{ticket.clientName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Solicitante</p>
                <p className="mt-1 text-sm text-slate-900">{ticket.requesterName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{"Respons\u00e1vel"}</p>
                <p className="mt-1 text-sm text-slate-900">{ticket.assigneeName ?? "N\u00e3o atribu\u00eddo"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Atualizado</p>
                <p className="mt-1 text-sm text-slate-900">{formatDate(ticket.updatedAt)}</p>
              </div>
              {ticket.resolvedAt ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resolvido em</p>
                  <p className="mt-1 text-sm text-slate-900">{formatDate(ticket.resolvedAt)}</p>
                </div>
              ) : null}
              {ticket.closedAt ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Encerrado em</p>
                  <p className="mt-1 text-sm text-slate-900">{formatDate(ticket.closedAt)}</p>
                </div>
              ) : null}
              {ticket.closingReason ? (
                <div className="md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Motivo de encerramento</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{ticket.closingReason}</p>
                </div>
              ) : null}
              <div className="md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{"Descri\u00e7\u00e3o"}</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">{ticket.description}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{"Hist\u00f3rico"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticket.history.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-slate-950">{item.authorName}</p>
                    <p className="text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{item.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <TicketAttachments attachments={ticket.attachments} />
        </div>
        <div className="space-y-6">
          <TicketDetailActions ticket={ticket} users={users} role={currentUser.role} />
        </div>
      </div>
    </div>
  );
}
