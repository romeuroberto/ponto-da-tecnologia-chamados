import Link from "next/link";
import type { Route } from "next";

import { TrendChart } from "@/components/dashboard/trend-chart";
import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requireRole } from "@/server/auth/session";
import { getParam } from "@/server/search-params";
import { reportService } from "@/server/services/report-service";

export default async function FinancialDashboardPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(["ADMIN", "ATTENDANT"]);
  const params = await searchParams;
  const from = getParam(params.from) ?? "";
  const to = getParam(params.to) ?? "";
  const exportParams = new URLSearchParams();

  if (from) {
    exportParams.set("from", from);
  }

  if (to) {
    exportParams.set("to", to);
  }

  const financialExportHref = `/api/reports/financial${exportParams.toString() ? `?${exportParams.toString()}` : ""}`;
  const dashboard = await reportService.getFinancialDashboard({
    from: from || undefined,
    to: to || undefined
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Financeiro"
        description="Visão dedicada de faturamento, cobrança, despesas e caixa do período."
        action={
          <a href={financialExportHref} className={buttonVariants({ variant: "outline" })}>
            Exportar CSV
          </a>
        }
      />

      {/* Filtro de período */}
      <form action="/financeiro">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <Input name="from" type="date" defaultValue={from} className="w-auto" />
            <Input name="to" type="date" defaultValue={to} className="w-auto" />
            <Button type="submit" variant="secondary">
              Filtrar
            </Button>
            <a href="/financeiro" className={buttonVariants({ variant: "outline" })}>
              Limpar
            </a>
          </CardContent>
        </Card>
      </form>

      {/* KPIs principais */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-emerald-200 bg-emerald-50/60">
          <CardContent className="p-5">
            <p className="text-sm text-emerald-700">Total faturado</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-950">{formatCurrency(dashboard.summary.totalAmount)}</p>
          </CardContent>
        </Card>
        <Card className="border-sky-200 bg-sky-50/60">
          <CardContent className="p-5">
            <p className="text-sm text-sky-700">Recebido</p>
            <p className="mt-2 text-2xl font-semibold text-sky-950">{formatCurrency(dashboard.summary.paidAmount)}</p>
          </CardContent>
        </Card>
        <Card className="border-rose-200 bg-rose-50/60">
          <CardContent className="p-5">
            <p className="text-sm text-rose-700">Pendente de recebimento</p>
            <p className="mt-2 text-2xl font-semibold text-rose-950">{formatCurrency(dashboard.summary.pendingAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">Média por recebível</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(dashboard.summary.averageTicketValue)}</p>
          </CardContent>
        </Card>
      </section>

      {/* KPIs secundários */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">Recebíveis no período</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{dashboard.summary.totalReceivables}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">Pendentes de cobrança</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{dashboard.summary.pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">Em aberto já faturado</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(dashboard.summary.invoicedOpenAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">Descontos concedidos</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(dashboard.summary.discountAmount)}</p>
          </CardContent>
        </Card>
      </section>

      {/* Caixa do período */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-emerald-200 bg-emerald-50/60">
          <CardContent className="p-5">
            <p className="text-sm text-emerald-700">Entradas de caixa</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-950">{formatCurrency(dashboard.cash.inflowAmount)}</p>
          </CardContent>
        </Card>
        <Card className="border-rose-200 bg-rose-50/60">
          <CardContent className="p-5">
            <p className="text-sm text-rose-700">Saídas de caixa</p>
            <p className="mt-2 text-2xl font-semibold text-rose-950">{formatCurrency(dashboard.cash.outflowAmount)}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-slate-50/70">
          <CardContent className="p-5">
            <p className="text-sm text-slate-700">Saldo do período</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(dashboard.cash.balanceAmount)}</p>
          </CardContent>
        </Card>
      </section>

      {/* Status do pipeline e tipos de cobrança */}
      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status financeiro</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {dashboard.byFinancialStatus.map((item) => (
              <div key={item.status} className="rounded-xl border border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-slate-900">{item.label}</span>
                  <span className="text-sm font-semibold text-slate-950">{item.total}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{formatCurrency(item.amount)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipos de cobrança</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.byBillingType.map((item) => (
              <div key={item.type} className="rounded-xl border border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-slate-900">{item.label}</span>
                  <span className="text-sm font-semibold text-slate-950">{item.total}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{formatCurrency(item.amount)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Gráficos de tendência */}
      <section className="grid gap-6 xl:grid-cols-2">
        <TrendChart
          title="Faturamentos recentes"
          description="Quantidade de recebíveis criados ou faturados nos últimos 7 dias."
          total={dashboard.trend.reduce((sum, item) => sum + item.invoiced, 0)}
          data={dashboard.trend.map((item) => ({ label: item.label, value: item.invoiced }))}
          tone="blue"
        />
        <TrendChart
          title="Recebimentos recentes"
          description="Quantidade de recebíveis pagos nos últimos 7 dias."
          total={dashboard.trend.reduce((sum, item) => sum + item.paid, 0)}
          data={dashboard.trend.map((item) => ({ label: item.label, value: item.paid }))}
          tone="green"
        />
      </section>

      {/* Despesas */}
      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Despesas do período</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 px-4 py-3">
              <p className="text-sm text-slate-600">Total de lançamentos</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{dashboard.expenses.totalCount}</p>
            </div>
            <div className="rounded-xl border border-slate-200 px-4 py-3">
              <p className="text-sm text-slate-600">Pendentes</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{formatCurrency(dashboard.expenses.pendingAmount)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 px-4 py-3">
              <p className="text-sm text-slate-600">Pagas</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{formatCurrency(dashboard.expenses.paidAmount)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Despesas por categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.expenses.byCategory.length > 0 ? (
              dashboard.expenses.byCategory.slice(0, 6).map((item) => (
                <div key={item.category} className="rounded-xl border border-slate-200 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-slate-900">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-950">{item.total}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{formatCurrency(item.amount)}</p>
                </div>
              ))
            ) : (
              <EmptyState title="Sem despesas registradas" description="Quando houver saídas no período, elas aparecerão aqui." />
            )}
          </CardContent>
        </Card>
      </section>

      {/* Clientes e atividade recente */}
      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Clientes com mais pendência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.pendingByClient.length > 0 ? (
              dashboard.pendingByClient.slice(0, 10).map((item) => (
                <div key={item.clientId} className="rounded-xl border border-slate-200 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-slate-900">{item.clientName}</span>
                    <span className="text-sm font-semibold text-slate-950">{formatCurrency(item.total)}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{item.count} lançamento(s) pendente(s)</p>
                </div>
              ))
            ) : (
              <EmptyState title="Sem pendências financeiras" description="Não há valores pendentes por cliente neste momento." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade financeira recente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.recentActivity.length > 0 ? (
              dashboard.recentActivity.map((item) => (
                <Link
                  key={item.id}
                  href={`/chamados/${item.ticketId}` as Route}
                  className="block rounded-xl border border-slate-200 p-4 transition-colors hover:border-slate-400 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-950">{item.ticketNumber}</p>
                    <p className="text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{item.ticketTitle}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.clientName}</p>
                  <p className="mt-2 text-sm text-slate-700">{item.message}</p>
                  <p className="mt-2 text-xs text-slate-500">Por {item.authorName}</p>
                </Link>
              ))
            ) : (
              <EmptyState title="Sem atividade financeira" description="Quando houver movimentações financeiras, elas aparecerão aqui." />
            )}
          </CardContent>
        </Card>
      </section>

      {/* Navegação rápida */}
      <nav className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
        <Link href="/financeiro/cobrancas" className={buttonVariants({ variant: "outline" })}>Cobranças</Link>
        <Link href="/financeiro/despesas" className={buttonVariants({ variant: "outline" })}>Despesas</Link>
        <Link href="/financeiro/clientes" className={buttonVariants({ variant: "outline" })}>Clientes</Link>
        <Link href="/relatorios" className={buttonVariants({ variant: "outline" })}>Relatórios completos</Link>
      </nav>
    </div>
  );
}
