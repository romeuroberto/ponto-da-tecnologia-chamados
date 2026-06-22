import type { Route } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { requireRole } from "@/server/auth/session";
import { getParam } from "@/server/search-params";
import { reportService } from "@/server/services/report-service";
import type { FinancialStatus } from "@/types";

const STATUS_OPTIONS: Array<{ value: FinancialStatus | ""; label: string }> = [
  { value: "", label: "Todos os status" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "FATURADO", label: "Faturado" },
  { value: "PAGO", label: "Pago" },
  { value: "CANCELADO", label: "Cancelado" }
];

const statusBadge: Record<FinancialStatus, { label: string; className: string }> = {
  PENDENTE:   { label: "Pendente",    className: "bg-slate-100 text-slate-700" },
  EM_ANALISE: { label: "Em análise",  className: "bg-amber-100 text-amber-800" },
  APROVADO:   { label: "Aprovado",    className: "bg-amber-100 text-amber-800" },
  FATURADO:   { label: "Faturado",    className: "bg-violet-100 text-violet-700" },
  PAGO:       { label: "Pago",        className: "bg-green-100 text-green-800 font-semibold" },
  CANCELADO:  { label: "Cancelado",   className: "bg-rose-100 text-rose-700" }
};

const typeLabel: Record<string, string> = {
  ticket:  "Chamado",
  sale:    "Venda",
  monthly: "Mensalidade",
  rental:  "Locação"
};

export default async function ExtractPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(["ADMIN", "ATTENDANT"]);
  const params = await searchParams;
  const statusParam = getParam(params.status) ?? "";
  const from = getParam(params.from) ?? "";
  const to = getParam(params.to) ?? "";

  const items = await reportService.getReceivablesExtract({
    financialStatus: (statusParam as FinancialStatus) || undefined,
    from: from || undefined,
    to: to || undefined
  });

  const totalAmount = items.reduce((sum, r) => sum + r.totalAmount, 0);
  const hasPeriodFilter = from || to;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Extrato de Recebíveis"
        description="Todos os recebíveis do período: chamados, vendas, mensalidades e locações."
        action={
          hasPeriodFilter ? (
            <Link
              href={`/financeiro/extrato${statusParam ? `?status=${statusParam}` : ""}` as Route}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Limpar período
            </Link>
          ) : null
        }
      />

      {/* Filtros de data */}
      <form action="/financeiro/extrato">
        <Card>
          <CardContent className="flex flex-wrap items-end gap-3 p-4">
            <div className="grid gap-1">
              <label className="text-xs font-semibold text-slate-600">De</label>
              <Input name="from" type="date" defaultValue={from} className="w-40" />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-semibold text-slate-600">Até</label>
              <Input name="to" type="date" defaultValue={to} className="w-40" />
            </div>
            {statusParam ? <input type="hidden" name="status" value={statusParam} /> : null}
            <Button type="submit" variant="secondary">Filtrar período</Button>
          </CardContent>
        </Card>
      </form>

      {/* Pills de status */}
      <form action="/financeiro/extrato" className="flex flex-wrap gap-2">
        {from ? <input type="hidden" name="from" value={from} /> : null}
        {to ? <input type="hidden" name="to" value={to} /> : null}
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="submit"
            name="status"
            value={opt.value}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
              statusParam === opt.value
                ? "border-sky-600 bg-sky-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </form>

      {/* Métricas rápidas */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">Total de itens</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">Valor total</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(totalAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">Filtro ativo</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {statusParam
                ? statusBadge[statusParam as FinancialStatus]?.label ?? "—"
                : "Todos os status"}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Lista */}
      {items.length > 0 ? (
        <div className="space-y-3">
          <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-4 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid">
            <span>Descrição / Cliente</span>
            <span>Tipo</span>
            <span>Status</span>
            <span>Criado em</span>
            <span className="text-right">Total</span>
          </div>

          {items.map((item) => {
            const badge = statusBadge[item.status];
            const isTicket = item.type === "ticket";
            const href = isTicket && item.ticketId
              ? (`/chamados/${item.ticketId}/financeiro` as Route)
              : null;

            const inner = (
              <>
                {/* Mobile */}
                <div className="lg:hidden space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {typeLabel[item.type] ?? item.type} · {item.number}
                      </p>
                      <p className="mt-0.5 font-semibold text-slate-950">{item.title}</p>
                      <p className="text-sm text-slate-600">{item.clientName}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-right font-semibold text-slate-950">{formatCurrency(item.totalAmount)}</p>
                </div>

                {/* Desktop */}
                <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_1fr] items-center gap-4 lg:grid">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.number}</p>
                    <p className="mt-0.5 font-semibold text-slate-950 leading-tight">{item.title}</p>
                    <p className="text-sm text-slate-600">{item.clientName}</p>
                  </div>
                  <span className="text-sm text-slate-700">{typeLabel[item.type] ?? item.type}</span>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                    {badge.label}
                  </span>
                  <span className="text-sm text-slate-600">
                    {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                  <span className="text-right font-semibold text-slate-950">{formatCurrency(item.totalAmount)}</span>
                </div>
              </>
            );

            return href ? (
              <Link
                key={item.id}
                href={href}
                className="block rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50"
              >
                {inner}
              </Link>
            ) : (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
                {inner}
              </div>
            );
          })}

          <div className="flex justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-sm font-semibold text-slate-700">Total geral</span>
            <span className="text-sm font-semibold text-slate-950">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      ) : (
        <EmptyState
          title="Nenhum recebível encontrado"
          description="Não há registros financeiros para o filtro selecionado."
        />
      )}
    </div>
  );
}
