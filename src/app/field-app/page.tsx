import type { Route } from "next";
import Link from "next/link";
import { CheckCircle2, Clock3, MapPinned, NotebookPen, TimerReset } from "lucide-react";

import { FieldAppClaimTicketButton } from "@/components/field-app/field-app-claim-ticket-button";
import { FieldAppTicketCard } from "@/components/field-app/field-app-ticket-card";
import { compareAvailableFieldTickets } from "@/lib/field-app";
import { PortalAppEmptyState } from "@/components/portal-app/portal-app-empty-state";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/server/auth/session";
import { ticketService } from "@/server/services/ticket-service";

export default async function FieldAppHomePage() {
  const currentUser = await requireRole(["TECHNICIAN"]);
  const { items } = await ticketService.searchTickets({
    assigneeId: currentUser.id,
    sort: "updated_desc",
    pageSize: 20
  });

  const inProgressCount = items.filter((ticket) => ticket.status === "IN_PROGRESS").length;
  const waitingCustomerCount = items.filter((ticket) => ticket.status === "WAITING_CUSTOMER").length;
  const closedTodayCount = items.filter((ticket) => ticket.status === "CLOSED").length;
  const fieldVisitCount = items.filter((ticket) => ticket.attendanceType === "FIELD_VISIT").length;
  const pendingFieldVisits = items.filter(
    (ticket) => ticket.attendanceType === "FIELD_VISIT" && ticket.status !== "CLOSED" && ticket.status !== "CANCELED"
  );
  const waitingCustomerTickets = items.filter((ticket) => ticket.status === "WAITING_CUSTOMER");
  const availableResult = await ticketService.searchTickets({
    unassigned: true,
    status: "OPEN",
    sort: "updated_desc",
    pageSize: 8
  });
  const availableTickets = [...availableResult.items].sort(compareAvailableFieldTickets);

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-slate-950 px-5 py-6 text-white shadow-xl shadow-slate-950/10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200">Operação de campo</p>
        <h1 className="mt-2 text-3xl font-semibold">Seu dia de atendimento</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Acompanhe os chamados atribuídos a você, registre ações rápidas e finalize visitas sem depender do dashboard completo.
        </p>

        <Link href="/field-app/chamados" className="mt-5 inline-flex">
          <Button className="h-11 rounded-2xl bg-emerald-500 px-4 text-slate-950 hover:bg-emerald-400">
            Ver meus chamados
          </Button>
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50 px-4 py-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <TimerReset className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">Em atendimento</p>
          </div>
          <p className="mt-2 text-3xl font-semibold text-emerald-950">{inProgressCount}</p>
        </div>
        <div className="rounded-[1.6rem] border border-amber-200 bg-amber-50 px-4 py-4">
          <div className="flex items-center gap-2 text-amber-700">
            <Clock3 className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">Aguardando</p>
          </div>
          <p className="mt-2 text-3xl font-semibold text-amber-950">{waitingCustomerCount}</p>
        </div>
        <div className="rounded-[1.6rem] border border-sky-200 bg-sky-50 px-4 py-4">
          <div className="flex items-center gap-2 text-sky-700">
            <MapPinned className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">Visitas</p>
          </div>
          <p className="mt-2 text-3xl font-semibold text-sky-950">{fieldVisitCount}</p>
        </div>
        <div className="rounded-[1.6rem] border border-violet-200 bg-violet-50 px-4 py-4">
          <div className="flex items-center gap-2 text-violet-700">
            <CheckCircle2 className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">Concluídos</p>
          </div>
          <p className="mt-2 text-3xl font-semibold text-violet-950">{closedTodayCount}</p>
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Atalho</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Registro rápido</h2>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <NotebookPen className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Entre em um chamado para mudar status, responder no histórico, enviar anexo e registrar check-in ou check-out em visitas.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Visitas em campo</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Atendimentos presenciais</h2>
          </div>
          <Link href="/field-app/chamados?attendanceType=FIELD_VISIT" className="text-sm font-semibold text-emerald-700">
            Ver todos
          </Link>
        </div>

        {pendingFieldVisits.length > 0 ? (
          <div className="space-y-3">
            {pendingFieldVisits.slice(0, 3).map((ticket) => (
              <FieldAppTicketCard key={ticket.id} ticket={ticket} href={`/field-app/chamados/${ticket.id}` as Route} />
            ))}
          </div>
        ) : (
          <PortalAppEmptyState
            icon={MapPinned}
            title="Nenhuma visita em aberto"
            description="Quando houver atendimento presencial atribuído a você, ele vai aparecer aqui com acesso rápido para check-in e atualização."
          />
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Pendências</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Aguardando retorno</h2>
          </div>
          <Link href="/field-app/chamados?status=WAITING_CUSTOMER" className="text-sm font-semibold text-emerald-700">
            Filtrar
          </Link>
        </div>

        {waitingCustomerTickets.length > 0 ? (
          <div className="space-y-3">
            {waitingCustomerTickets.slice(0, 3).map((ticket) => (
              <FieldAppTicketCard key={ticket.id} ticket={ticket} href={`/field-app/chamados/${ticket.id}` as Route} />
            ))}
          </div>
        ) : (
          <PortalAppEmptyState
            icon={Clock3}
            title="Nenhum retorno pendente"
            description="Os chamados aguardando resposta do cliente ficam reunidos aqui para acompanhamento rápido."
          />
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Disponíveis</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Chamados para assumir</h2>
          </div>
          <Link href="/field-app/chamados?scope=available" className="text-sm font-semibold text-emerald-700">
            Abrir fila
          </Link>
        </div>

        {availableTickets.length > 0 ? (
          <div className="space-y-3">
            {availableTickets.slice(0, 3).map((ticket) => (
              <FieldAppTicketCard
                key={ticket.id}
                ticket={ticket}
                href={`/field-app/chamados/${ticket.id}` as Route}
                showPreview
                footer={
                  <div className="space-y-3">
                    <Link
                      href={`/field-app/chamados/${ticket.id}` as Route}
                      className="block text-center text-sm font-semibold text-emerald-700"
                    >
                      Ver detalhes
                    </Link>
                    <FieldAppClaimTicketButton ticketId={ticket.id} />
                  </div>
                }
              />
            ))}
          </div>
        ) : (
          <PortalAppEmptyState
            icon={NotebookPen}
            title="Nenhum chamado disponível agora"
            description="Quando houver chamados abertos sem responsável, você poderá assumi-los diretamente por aqui."
          />
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Fila pessoal</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Chamados atribuídos</h2>
          </div>
          <Link href="/field-app/chamados" className="text-sm font-semibold text-emerald-700">
            Ver todos
          </Link>
        </div>

        {items.length > 0 ? (
          <div className="space-y-3">
            {items.slice(0, 4).map((ticket) => (
              <FieldAppTicketCard key={ticket.id} ticket={ticket} href={`/field-app/chamados/${ticket.id}` as Route} />
            ))}
          </div>
        ) : (
          <PortalAppEmptyState
            icon={MapPinned}
            title="Nenhum chamado atribuído"
            description="Quando a equipe vincular atendimentos a você, eles vão aparecer aqui prontos para operação em campo."
          />
        )}
      </section>
    </div>
  );
}
