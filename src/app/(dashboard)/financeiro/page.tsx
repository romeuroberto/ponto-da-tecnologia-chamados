import Link from "next/link";
import type { Route } from "next";

import { TrendChart } from "@/components/dashboard/trend-chart";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
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

  const quickFilters: Array<{ href: Route; label: string }> = [
    { href: "/relatorios", label: "Relatórios completos" },
    { href: "/chamados?status=RESOLVED", label: "Chamados resolvidos" },
    { href: "/clientes", label: "Clientes" }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Financeiro"
        description="Visão dedicada de faturamento, pendências, recebimentos e atividade financeira dos chamados."
        action={
          <div className="flex flex-wrap gap-2">
            {quickFilters.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button variant="outline">{item.label}</Button>
              </Link>
            ))}
            <a
              href={financialExportHref}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
            >
              Exportar financeiro CSV
            </a>
          </div>
        }
      />

      <form action="/financeiro">
        <Card>
          <CardContent className="grid gap-4 p-4 md:grid-cols-4">
            <Input name="from" type="date" defaultValue={from} />
            <Input name="to" type="date" defaultValue={to} />
            <Button type="submit" variant="secondary">
              Atualizar dashboard
            </Button>
            <a href="/financeiro" className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50">
              Limpar período
            </a>
          </CardContent>
        </Card>
      </form>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="border-sky-200 bg-sky-50/60">
          <CardContent className="p-5">
            <p className="text-sm text-sky-700">Chamados com financeiro</p>
            <p className="mt-2 text-3xl font-semibold text-sky-950">{dashboard.summary.totalTicketsWithBilling}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/60">
          <CardContent className="p-5">
            <p className="text-sm text-emerald-700">Total financeiro</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-950">{formatCurrency(dashboard.summary.totalAmount)}</p>
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
            <p className="text-sm text-slate-600">Faturados</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{dashboard.summary.invoicedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">Pagos</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{dashboard.summary.paidCount}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <TrendChart
          title="Faturamentos recentes"
          description="Quantidade de chamados faturados nos últimos 7 dias."
          total={dashboard.trend.reduce((sum, item) => sum + item.invoiced, 0)}
          data={dashboard.trend.map((item) => ({ label: item.label, value: item.invoiced }))}
          tone="blue"
        />
        <TrendChart
          title="Recebimentos recentes"
          description="Quantidade de chamados pagos nos últimos 7 dias."
          total={dashboard.trend.reduce((sum, item) => sum + item.paid, 0)}
          data={dashboard.trend.map((item) => ({ label: item.label, value: item.paid }))}
          tone="green"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
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
                  <p className="mt-1 text-sm text-slate-600">{item.count} chamado(s) pendente(s)</p>
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
                <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-950">{item.ticketNumber}</p>
                    <p className="text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{item.ticketTitle}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.clientName}</p>
                  <p className="mt-2 text-sm text-slate-700">{item.message}</p>
                  <p className="mt-2 text-xs text-slate-500">Por {item.authorName}</p>
                </div>
              ))
            ) : (
              <EmptyState title="Sem atividade financeira" description="Quando houver movimentações financeiras, elas aparecerão aqui." />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">Pendentes e em análise</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{dashboard.summary.pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">Recebido</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(dashboard.summary.paidAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">Ticket médio</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(dashboard.summary.averageTicketValue)}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">Em aberto já faturado</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(dashboard.summary.invoicedOpenAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">Aprovados aguardando faturamento</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{dashboard.summary.approvedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">Descontos concedidos</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(dashboard.summary.discountAmount)}</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
