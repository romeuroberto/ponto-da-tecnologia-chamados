import type { Route } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { PageHeader } from "@/components/layout/page-header";
import { PriorityBadge } from "@/components/tickets/priority-badge";
import { TicketSlaBadge } from "@/components/tickets/ticket-sla-badge";
import { StatusBadge } from "@/components/tickets/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatDate } from "@/lib/utils";
import { canCreateClient, canCreateTicket, canViewUsersModule } from "@/server/auth/permissions";
import { requireUser } from "@/server/auth/session";
import { dashboardService } from "@/server/services/dashboard-service";

export default async function DashboardPage() {
  const user = await requireUser();
  const {
    summary,
    recentTickets,
    criticalCount,
    unassignedCount,
    resolvedTodayCount,
    criticalTickets,
    unassignedTickets,
    waitingCustomerTickets,
    workload,
    trend,
    openedLast7Days,
    resolvedLast7Days,
    slaBreachedCount,
    slaWarningCount,
    slaBreachedTickets,
    slaWarningTickets
  } = await dashboardService.getSummary();
  const quickActions = [
    canCreateTicket(user.role)
      ? {
          title: "Novo chamado",
          description: "Registrar uma nova solicitação de suporte.",
          href: "/chamados/novo" as Route,
          variant: "default" as const
        }
      : null,
    {
      title: "Fila aberta",
      description: "Ver chamados abertos que ainda precisam de andamento.",
      href: "/chamados?status=OPEN&sort=updated_desc" as Route,
      variant: "outline" as const
    },
    {
      title: "Críticos",
      description: "Ir direto para os chamados mais urgentes.",
      href: "/chamados?priority=CRITICAL&sort=priority_desc" as Route,
      variant: "outline" as const
    },
    canCreateClient(user.role)
      ? {
          title: "Novo cliente",
          description: "Cadastrar um cliente para iniciar o atendimento.",
          href: "/clientes/novo" as Route,
          variant: "outline" as const
        }
      : null,
    canViewUsersModule(user.role)
      ? {
          title: "Equipe",
          description: "Ajustar usuários e perfis de acesso.",
          href: "/usuarios" as Route,
          variant: "outline" as const
        }
      : null
  ].filter(
    (item): item is { title: string; description: string; href: Route; variant: "default" | "outline" } => Boolean(item)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão resumida da operação de suporte."
        action={
          canCreateTicket(user.role) ? (
            <Link href="/chamados/novo" className={cn(buttonVariants({ variant: "default" }))}>
              Novo chamado
            </Link>
          ) : null
        }
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        <SummaryCard title="Abertos" value={summary.open} tone="blue" />
        <SummaryCard title="Em atendimento" value={summary.inProgress} tone="orange" />
        <SummaryCard title="Aguardando cliente" value={summary.waitingCustomer} tone="yellow" />
        <SummaryCard title="Encerrados" value={summary.closed} tone="slate" />
        <SummaryCard title="Críticos" value={criticalCount} tone="red" />
        <SummaryCard title="Sem responsável" value={unassignedCount} tone="violet" />
        <SummaryCard title="Resolvidos hoje" value={resolvedTodayCount} tone="green" />
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="border-rose-200 bg-rose-50/60">
          <CardHeader>
            <CardTitle className="text-rose-900">SLA vencido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-semibold text-rose-950">{slaBreachedCount}</p>
            {slaBreachedTickets.length > 0 ? (
              slaBreachedTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border border-rose-200 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                    <TicketSlaBadge ticket={ticket} />
                  </div>
                  <h3 className="mt-3 font-semibold text-slate-950">{ticket.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{ticket.clientName}</p>
                </div>
              ))
            ) : (
              <EmptyState title="Nenhum SLA vencido" description="Nenhum chamado ativo estourou o prazo neste momento." />
            )}
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/60">
          <CardHeader>
            <CardTitle className="text-amber-900">SLA em risco</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-semibold text-amber-950">{slaWarningCount}</p>
            {slaWarningTickets.length > 0 ? (
              slaWarningTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border border-amber-200 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                    <TicketSlaBadge ticket={ticket} />
                  </div>
                  <h3 className="mt-3 font-semibold text-slate-950">{ticket.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{ticket.clientName}</p>
                </div>
              ))
            ) : (
              <EmptyState title="Sem chamados em risco" description="Os chamados ativos ainda estao dentro de uma zona segura de prazo." />
            )}
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Ações rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={cn(
                  "rounded-2xl border border-slate-200 p-4 text-left transition-colors hover:border-sky-200 hover:bg-sky-50",
                  action.variant === "default" ? "border-sky-600 bg-sky-600 text-white hover:bg-sky-700 hover:text-white" : "text-slate-900"
                )}
              >
                <p className={cn("font-semibold", action.variant === "default" ? "text-white" : "text-slate-950")}>{action.title}</p>
                <p className={cn("mt-1 text-sm", action.variant === "default" ? "text-sky-100" : "text-slate-600")}>{action.description}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resumo da semana</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-sky-50 p-4">
              <p className="text-sm font-medium text-sky-700">Abertos em 7 dias</p>
              <p className="mt-2 text-3xl font-semibold text-sky-950">{openedLast7Days}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-700">Resolvidos em 7 dias</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-950">{resolvedLast7Days}</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4">
              <p className="text-sm font-medium text-slate-700">Saldo do período</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{openedLast7Days - resolvedLast7Days}</p>
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <TrendChart
          title="Tendência de abertura"
          description="Quantidade diária de chamados abertos."
          total={openedLast7Days}
          data={trend.map((item) => ({ label: item.label, value: item.opened }))}
          tone="blue"
        />
        <TrendChart
          title="Tendência de resolução"
          description="Quantidade diária de chamados resolvidos ou encerrados."
          total={resolvedLast7Days}
          data={trend.map((item) => ({ label: item.label, value: item.resolved }))}
          tone="green"
        />
      </section>
      <section className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Chamados críticos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {criticalTickets.length > 0 ? (
              criticalTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                  </div>
                  <h3 className="mt-3 font-semibold text-slate-950">{ticket.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{ticket.clientName}</p>
                </div>
              ))
            ) : (
              <EmptyState title="Nenhum chamado crítico" description="Ótimo sinal: não há chamados críticos neste momento." />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sem responsável</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {unassignedTickets.length > 0 ? (
              unassignedTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{ticket.number}</p>
                  <h3 className="mt-1 font-semibold text-slate-950">{ticket.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{ticket.clientName}</p>
                </div>
              ))
            ) : (
              <EmptyState title="Nenhum chamado sem responsável" description="Todos os chamados atuais já possuem responsável definido." />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Aguardando cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {waitingCustomerTickets.length > 0 ? (
              waitingCustomerTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={ticket.status} />
                  </div>
                  <h3 className="mt-3 font-semibold text-slate-950">{ticket.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{ticket.clientName}</p>
                </div>
              ))
            ) : (
              <EmptyState title="Sem pendências com cliente" description="Não há chamados aguardando retorno do cliente agora." />
            )}
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Atualizações recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTickets.length > 0 ? (
              recentTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{ticket.number}</p>
                  <h3 className="mt-1 font-semibold text-slate-950">{ticket.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">Atualizado em {formatDate(ticket.updatedAt)}</p>
                </div>
              ))
            ) : (
              <EmptyState title="Sem atualizações recentes" description="Quando os chamados forem movimentados, eles aparecerão aqui." />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Carga por responsável</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {workload.length > 0 ? (
              workload.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                  <span className="text-sm font-medium text-slate-700">{item.name}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{item.total} chamados</span>
                </div>
              ))
            ) : (
              <EmptyState title="Sem distribuição de carga" description="Atribua chamados aos usuários para acompanhar a carga da equipe." />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
