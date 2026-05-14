import { redirect } from "next/navigation";
import { ClipboardList, MapPinned, Paperclip, UserRound } from "lucide-react";

import { FieldAppServiceOrderCard } from "@/components/field-app/field-app-service-order-card";
import { TicketAttachments } from "@/components/tickets/ticket-attachments";
import { TicketFlowActions } from "@/components/tickets/ticket-flow-actions";
import { PriorityBadge } from "@/components/tickets/priority-badge";
import { StatusBadge } from "@/components/tickets/status-badge";
import { getAttendanceTypeLabel } from "@/lib/ticket-attendance";
import { formatDate } from "@/lib/utils";
import { requireRole } from "@/server/auth/session";
import { ticketService } from "@/server/services/ticket-service";

export default async function FieldAppTicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const currentUser = await requireRole(["TECHNICIAN"]);
  const { id } = await params;
  const ticket = await ticketService.getTicket(id);

  if (!ticket || ticket.assigneeId !== currentUser.id) {
    redirect("/field-app/chamados");
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[1.8rem] border border-slate-200 bg-white px-4 py-5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{ticket.number}</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">{ticket.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            <MapPinned className="h-3.5 w-3.5" />
            {getAttendanceTypeLabel(ticket.attendanceType)}
          </span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-[1.6rem] border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Cliente</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{ticket.clientName}</p>
        </div>
        <div className="rounded-[1.6rem] border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Atualizado</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{formatDate(ticket.updatedAt)}</p>
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-slate-200 bg-white px-4 py-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Solicitante</p>
            <p className="mt-1 text-base font-semibold text-slate-950">{ticket.requesterName}</p>
            {ticket.requesterEmail ? <p className="mt-1 text-sm text-slate-500">{ticket.requesterEmail}</p> : null}
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Descrição</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{ticket.description}</p>
        </div>

        {ticket.attendanceType === "FIELD_VISIT" ? (
          <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-950">
            <p className="font-semibold">
              {!ticket.checkedInAt
                ? "Ao chegar no cliente, registre o check-in."
                : !ticket.checkedOutAt
                  ? "Visita em andamento. Registre o check-out ao finalizar."
                  : "Check-in e check-out já registrados para esta visita."}
            </p>
            <p className="mt-1 text-sky-800">
              Isso ajuda a manter o histórico do atendimento presencial mais confiável para a operação.
            </p>
          </div>
        ) : null}
      </section>

      <TicketFlowActions ticket={ticket} users={[]} role={currentUser.role} currentUserId={currentUser.id} />

      {ticket.serviceOrders.length > 0 ? (
        <section className="rounded-[1.8rem] border border-slate-200 bg-white px-4 py-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Ordens de serviço</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">{ticket.serviceOrders.length} vinculada(s)</h2>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {ticket.serviceOrders.map((serviceOrder) => (
              <FieldAppServiceOrderCard
                key={serviceOrder.id}
                ticketId={ticket.id}
                serviceOrder={serviceOrder}
                currentUserId={currentUser.id}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-[1.8rem] border border-slate-200 bg-white px-4 py-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <Paperclip className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Arquivos e histórico</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Acompanhamento do chamado</h2>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {ticket.history.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-slate-950">{item.authorName}</p>
                <p className="text-xs text-slate-500">{formatDate(item.createdAt)}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">{item.message}</p>
            </div>
          ))}
        </div>
      </section>

      <TicketAttachments attachments={ticket.attachments} />
    </div>
  );
}
