import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { TicketAttachments } from "@/components/tickets/ticket-attachments";
import { TicketDetailActions } from "@/components/tickets/ticket-detail-actions";
import { TicketTitleEditor } from "@/components/tickets/ticket-title-editor";
import { TicketFlowActions } from "@/components/tickets/ticket-flow-actions";
import { TicketFlowOverview } from "@/components/tickets/ticket-flow-overview";
import { PriorityBadge } from "@/components/tickets/priority-badge";
import { StatusBadge } from "@/components/tickets/status-badge";
import { TicketServiceOrdersPanel } from "@/components/tickets/ticket-service-orders-panel";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAttendanceTypeLabel } from "@/lib/ticket-attendance";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { canViewFinancialModule } from "@/server/auth/permissions";
import { requireUser } from "@/server/auth/session";
import { catalogService } from "@/server/services/catalog-service";
import { clientService } from "@/server/services/client-service";
import { contractRepository } from "@/server/repositories/contract-repository";
import { ticketService } from "@/server/services/ticket-service";
import { userService } from "@/server/services/user-service";

const financialStatusLabels: Record<string, { label: string; className: string }> = {
  PENDENTE: { label: "Pendente", className: "bg-slate-100 text-slate-700" },
  EM_ANALISE: { label: "Em revisao interna", className: "bg-blue-100 text-blue-700" },
  APROVADO: { label: "Pronto para faturar", className: "bg-emerald-100 text-emerald-700" },
  FATURADO: { label: "Faturado", className: "bg-violet-100 text-violet-700" },
  PAGO: { label: "Pago", className: "bg-green-100 text-green-800" },
  CANCELADO: { label: "Cancelado", className: "bg-rose-100 text-rose-700" }
};

const expenseStatusLabels: Record<string, string> = {
  PENDENTE: "Pendente",
  PAGA: "Paga",
  CANCELADA: "Cancelada"
};

export default async function TicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const currentUser = await requireUser();
  const { id } = await params;
  const [ticket, users, serviceCatalogItems, partCatalogItems] = await Promise.all([
    ticketService.getTicket(id),
    userService.listAssignableUsers(),
    catalogService.listServiceItems(),
    catalogService.listPartItems()
  ]);

  const client = ticket ? await clientService.getClient(ticket.clientId) : null;

  if (!ticket) {
    notFound();
  }

  const activeContract = await contractRepository.findActiveByClientId(ticket.clientId);
  const canViewFinancial = canViewFinancialModule(currentUser.role);
  const contractCoversCategory = !!(
    activeContract &&
    ticket.category &&
    (
      activeContract.coverageType === "TOTAL" ||
      activeContract.coveredCategories.length === 0 ||
      activeContract.coveredCategories.includes(ticket.category)
    )
  );
  const relatedExpenses = ticket.expenses ?? [];
  const activeExpenseAmount = relatedExpenses
    .filter((expense) => expense.status !== "CANCELADA")
    .reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        {currentUser.role === "ADMIN" || currentUser.role === "ATTENDANT" ? (
          <TicketTitleEditor ticketId={ticket.id} title={ticket.title} />
        ) : (
          <h1 className="text-xl font-bold text-slate-950">{ticket.title}</h1>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-500">{ticket.number} · {ticket.clientName}</span>
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:hidden">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Responsável</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">{ticket.assigneeName ?? "Não atribuído"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Atualizado</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">{formatDate(ticket.updatedAt)}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="space-y-6 xl:order-2">
          <TicketFlowOverview ticket={ticket} />

          {(ticket.status === "RESOLVED" || ticket.status === "CLOSED") && ticket.billing?.financialStatus === "PENDENTE" && !contractCoversCategory ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span className="font-semibold">Financeiro pendente.</span>{" "}
              Este chamado já foi concluído tecnicamente, mas o ciclo financeiro ainda não foi avançado.{" "}
              <a href={`/chamados/${ticket.id}/financeiro`} className="font-semibold underline">
                Acessar financeiro →
              </a>
            </div>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Resumo do chamado</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cliente</p>
                <p className="mt-1 text-sm text-slate-900">{ticket.clientName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Solicitante</p>
                <p className="mt-1 text-sm text-slate-900">{ticket.requesterName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo de atendimento</p>
                <p className="mt-1 text-sm text-slate-900">{getAttendanceTypeLabel(ticket.attendanceType)}</p>
              </div>
              {activeContract && ticket.category ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cobertura contratual</p>
                  {activeContract.coverageType === "TOTAL" || activeContract.coveredCategories.includes(ticket.category) ? (
                    <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                      Coberto pelo contrato
                    </span>
                  ) : (
                    <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                      Fora do contrato
                    </span>
                  )}
                </div>
              ) : null}
              <div className="hidden xl:block">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Responsável</p>
                <p className="mt-1 text-sm text-slate-900">{ticket.assigneeName ?? "Não atribuído"}</p>
              </div>
              <div className="hidden xl:block">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Atualizado</p>
                <p className="mt-1 text-sm text-slate-900">{formatDate(ticket.updatedAt)}</p>
              </div>
              {ticket.resolvedAt ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Concluído em</p>
                  <p className="mt-1 text-sm text-slate-900">{formatDate(ticket.resolvedAt)}</p>
                </div>
              ) : null}
              {ticket.closedAt ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fechado em</p>
                  <p className="mt-1 text-sm text-slate-900">{formatDate(ticket.closedAt)}</p>
                </div>
              ) : null}
              {ticket.closingReason ? (
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Motivo do cancelamento</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{ticket.closingReason}</p>
                </div>
              ) : null}
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Descrição</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{ticket.description}</p>
              </div>
            </CardContent>
          </Card>

          <TicketServiceOrdersPanel
            ticket={ticket}
            users={users}
            role={currentUser.role}
            currentUserId={currentUser.id}
            serviceCatalogItems={serviceCatalogItems}
            partCatalogItems={partCatalogItems}
            isReseller={client?.isReseller ?? false}
          />

          <Card>
            <CardHeader>
              <CardTitle>Histórico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticket.history.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-semibold text-slate-950">{item.authorName}</p>
                    <p className="text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <TicketAttachments attachments={ticket.attachments} />
        </div>

        <div className="space-y-6 xl:order-1 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto">
          {currentUser.role === "ADMIN" ? (
            <TicketDetailActions ticket={ticket} users={users} role={currentUser.role} currentUserId={currentUser.id} contractCoversCategory={contractCoversCategory} />
          ) : (
            <TicketFlowActions ticket={ticket} users={users} role={currentUser.role} currentUserId={currentUser.id} contractCoversCategory={contractCoversCategory} />
          )}

          {canViewFinancial ? (
            <Card>
              <CardHeader>
                <CardTitle>Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ticket.billing ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                        <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold", financialStatusLabels[ticket.billing.financialStatus]?.className)}>
                          {financialStatusLabels[ticket.billing.financialStatus]?.label}
                        </span>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total</p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">{formatCurrency(ticket.billing.totalAmount)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">{ticket.billing.entries.length} lancamento(s) registrado(s)</p>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Nenhum financeiro iniciado para este chamado.</p>
                )}
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Despesas vinculadas</p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">
                        {relatedExpenses.length} registro(s) · {formatCurrency(activeExpenseAmount)}
                      </p>
                    </div>
                    <Link
                      href={`/financeiro/despesas?ticketId=${ticket.id}` as Route}
                      className={cn(buttonVariants({ variant: "outline" }), "h-9")}
                    >
                      Ver despesas
                    </Link>
                  </div>
                  {relatedExpenses.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {relatedExpenses.slice(0, 3).map((expense) => (
                        <div key={expense.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-slate-900">{expense.description}</span>
                            <span className="font-semibold text-slate-950">{formatCurrency(expense.amount)}</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {expenseStatusLabels[expense.status]} · {new Date(expense.expenseDate).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">Nenhuma despesa operacional vinculada a este chamado.</p>
                  )}
                </div>
                <Link href={`/chamados/${id}/financeiro` as Route} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
                  {ticket.billing ? "Gerenciar financeiro" : "Iniciar financeiro"}
                </Link>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
