import { PageHeader } from "@/components/layout/page-header";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getParam } from "@/server/search-params";
import { reportService } from "@/server/services/report-service";

export default async function ReportsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const from = getParam(params.from) ?? "";
  const to = getParam(params.to) ?? "";
  const report = await reportService.getOperationalReport({
    from: from || undefined,
    to: to || undefined
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Relatorios" description="Primeira camada de relatorios operacionais para acompanhar volume, SLA e distribuicao." />
      <form action="/relatorios" className="contents">
        <Card>
          <CardContent className="grid gap-4 p-4 md:grid-cols-4">
            <Input name="from" type="date" defaultValue={from} />
            <Input name="to" type="date" defaultValue={to} />
            <Button type="submit" variant="secondary">Atualizar relatorio</Button>
            <a href="/relatorios" className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50">
              Limpar periodo
            </a>
          </CardContent>
        </Card>
      </form>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">Total no periodo</p>
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
            <p className="text-sm text-slate-600">Concluidos</p>
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
          title="Aberturas no periodo"
          description="Quantidade diaria de chamados abertos nos ultimos 7 dias."
          total={report.trend.reduce((sum, item) => sum + item.opened, 0)}
          data={report.trend.map((item) => ({ label: item.label, value: item.opened }))}
          tone="blue"
        />
        <TrendChart
          title="Conclusoes no periodo"
          description="Quantidade diaria de chamados resolvidos ou encerrados nos ultimos 7 dias."
          total={report.trend.reduce((sum, item) => sum + item.resolved, 0)}
          data={report.trend.map((item) => ({ label: item.label, value: item.resolved }))}
          tone="green"
        />
      </section>
      <section className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Tempo medio de resolucao</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold text-slate-950">
              {report.summary.averageResolutionHours !== null ? `${report.summary.averageResolutionHours}h` : "-"}
            </p>
            <p className="mt-2 text-sm text-slate-600">Media calculada com base nos chamados resolvidos ou encerrados no periodo filtrado.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Por status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.byStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
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
            <CardTitle>Distribuicao por responsavel</CardTitle>
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
    </div>
  );
}
