import { PageHeader } from "@/components/layout/page-header";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { canViewFinancialModule } from "@/server/auth/permissions";
import { requireUser } from "@/server/auth/session";
import { getParam } from "@/server/search-params";
import { reportService } from "@/server/services/report-service";

const technicalStatusLabels: Record<string, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em atendimento",
  WAITING_CUSTOMER: "Aguardando cliente",
  WAITING_PARTS: "Aguardando peças",
  CLOSED: "Concluído tecnicamente",
  CANCELED: "Cancelado"
};

const financialStatusLabels: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_ANALISE: "Em revisão interna",
  APROVADO: "Pronto para faturar",
  FATURADO: "Faturado",
  PAGO: "Pago",
  CANCELADO: "Cancelado"
};

export default async function ReportsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const from = getParam(params.from) ?? "";
  const to = getParam(params.to) ?? "";
  const canViewFinancial = canViewFinancialModule(user.role);
  const operationalExportParams = new URLSearchParams();

  if (from) operationalExportParams.set("from", from);
  if (to) operationalExportParams.set("to", to);

  const operationalExportHref = `/api/reports/operational${operationalExportParams.toString() ? `?${operationalExportParams.toString()}` : ""}`;
  const financialExportHref = `/api/reports/financial${operationalExportParams.toString() ? `?${operationalExportParams.toString()}` : ""}`;
  const report = await reportService.getOperationalReport({
    from: from || undefined,
    to: to || undefined
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Relatórios"
        description="Camada operacional e financeira para acompanhar volume, conclusão tecnica, SLA e cobrança."
        action={
          <div className="flex flex-wrap gap-2">
            <a href={operationalExportHref} className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50">
              Exportar operacional CSV
            </a>
            {canViewFinancial ? (
              <a href={financialExportHref} className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50">
                Exportar financeiro CSV
              </a>
            ) : null}
          </div>
        }
      />
      <form action="/relatórios">
        <Card>
          <CardContent className="grid gap-4 p-4 md:grid-cols-4">
            <Input name="from" type="date" defaultValue={from} />
            <Input name="to" type="date" defaultValue={to} />
            <Button type="submit" variant="secondary">
              Atualizar relatório
            </Button>
            <a href="/relatórios" className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50">
              Limpar período
            </a>
          </CardContent>
        </Card>
      </form>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">Total no período</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{report.summary.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">Ativos</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{report.summary.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">Concluídos técnicos</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{report.summary.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">Cancelados</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{report.summary.canceled}</p>
          </CardContent>
        </Card>
        <Card className="border-rose-200 bg-rose-50/60">
          <CardContent className="p-5">
            <p className="text-sm text-rose-700">SLA vencido</p>
            <p className="mt-2 text-3xl font-semibold text-rose-950">{report.summary.slaBreached}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="p-5">
            <p className="text-sm text-amber-700">SLA em risco</p>
            <p className="mt-2 text-3xl font-semibold text-amber-950">{report.summary.slaWarning}</p>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <TrendChart
          title="Aberturas no período"
          description="Quantidade diária de chamados abertos nos ultimos 7 dias."
          total={report.trend.reduce((sum, item) => sum + item.opened, 0)}
          data={report.trend.map((item) => ({ label: item.label, value: item.opened }))}
          tone="blue"
        />
        <TrendChart
          title="Conclusões técnicas no período"
          description="Quantidade diária de chamados concluídos tecnicamente nos ultimos 7 dias."
          total={report.trend.reduce((sum, item) => sum + item.resolved, 0)}
          data={report.trend.map((item) => ({ label: item.label, value: item.resolved }))}
          tone="green"
        />
      </section>
      {canViewFinancial ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card className="border-sky-200 bg-sky-50/60">
            <CardContent className="p-5">
              <p className="text-sm text-sky-700">Chamados com financeiro</p>
              <p className="mt-2 text-3xl font-semibold text-sky-950">{report.financial.totalTicketsWithBilling}</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50/60">
            <CardContent className="p-5">
              <p className="text-sm text-emerald-700">Subtotal</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-950">{formatCurrency(report.financial.subtotal)}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/60">
            <CardContent className="p-5">
              <p className="text-sm text-amber-700">Descontos</p>
              <p className="mt-2 text-2xl font-semibold text-amber-950">{formatCurrency(report.financial.discount)}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-slate-50/60">
            <CardContent className="p-5">
              <p className="text-sm text-slate-700">Total financeiro</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(report.financial.total)}</p>
            </CardContent>
          </Card>
          <Card className="border-rose-200 bg-rose-50/60">
            <CardContent className="p-5">
              <p className="text-sm text-rose-700">Pendente de cobrança ou recebimento</p>
              <p className="mt-2 text-2xl font-semibold text-rose-950">{formatCurrency(report.financial.pendingTotal)}</p>
            </CardContent>
          </Card>
        </section>
      ) : null}
      <section className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Tempo médio de conclusão tecnica</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold text-slate-950">
              {report.summary.averageResolutionHours !== null ? `${report.summary.averageResolutionHours}h` : "-"}
            </p>
            <p className="mt-2 text-sm text-slate-600">Média calculada com base nos chamados concluídos tecnicamente no período filtrado.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Por status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.byStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                <span className="text-sm font-medium text-slate-700">{technicalStatusLabels[item.status] ?? item.label}</span>
                <span className="text-sm font-semibold text-slate-950">{item.total}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Por prioridade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.byPriority.map((item) => (
              <div key={item.priority} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
                <span className="text-sm font-semibold text-slate-950">{item.total}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Clientes com mais chamados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.byClient.slice(0, 8).map((item) => (
              <div key={item.clientId} className="rounded-xl border border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-slate-900">{item.clientName}</span>
                  <span className="text-sm font-semibold text-slate-950">{item.total}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">Ativos: {item.active} | Concluidos: {item.completed}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por responsável</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.byAssignee.slice(0, 8).map((item) => (
              <div key={item.assigneeId ?? item.assigneeName} className="rounded-xl border border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-slate-900">{item.assigneeName}</span>
                  <span className="text-sm font-semibold text-slate-950">{item.total}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">Ativos: {item.active} | Concluidos: {item.completed}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      {canViewFinancial ? (
        <section className="grid gap-6 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Por tipo de cobrança</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.financial.byBillingType.map((item) => (
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
          <Card>
            <CardHeader>
              <CardTitle>Por status financeiro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.financial.byFinancialStatus.map((item) => (
                <div key={item.status} className="rounded-xl border border-slate-200 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-slate-900">{financialStatusLabels[item.status] ?? item.label}</span>
                    <span className="text-sm font-semibold text-slate-950">{item.total}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{formatCurrency(item.amount)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pendência por cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.financial.pendingByClient.slice(0, 8).map((item) => (
                <div key={item.clientId} className="rounded-xl border border-slate-200 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-slate-900">{item.clientName}</span>
                    <span className="text-sm font-semibold text-slate-950">{formatCurrency(item.total)}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{item.count} chamado(s) pendente(s)</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
