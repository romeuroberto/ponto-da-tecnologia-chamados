import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { MonthlyBillingList } from "@/components/contracts/monthly-billing-list";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requireRole } from "@/server/auth/session";
import { clientService } from "@/server/services/client-service";
import { billingRepository } from "@/server/repositories/billing-repository";
import { contractMonthlyBillingRepository } from "@/server/repositories/contract-monthly-billing-repository";
import { saleRepository } from "@/server/repositories/sale-repository";

const billingTypeLabel: Record<string, string> = {
  AVULSO: "Avulso",
  CONTRATO: "Contrato",
  GARANTIA: "Garantia",
  CORTESIA: "Cortesia"
};

const statusLabel: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_ANALISE: "Em análise",
  APROVADO: "Aprovado",
  FATURADO: "Faturado",
  PAGO: "Pago",
  CANCELADO: "Cancelado"
};

const statusColor: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-800",
  EM_ANALISE: "bg-blue-100 text-blue-800",
  APROVADO: "bg-emerald-100 text-emerald-800",
  FATURADO: "bg-purple-100 text-purple-800",
  PAGO: "bg-slate-100 text-slate-600",
  CANCELADO: "bg-rose-100 text-rose-700"
};

export default async function ClientFinanceiroPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["ADMIN", "ATTENDANT"]);
  const { id } = await params;

  const client = await clientService.getClient(id);
  if (!client) notFound();

  await contractMonthlyBillingRepository.generatePending(id);

  const [ticketBillings, monthlyBillings, sales] = await Promise.all([
    billingRepository.listByClient(id),
    contractMonthlyBillingRepository.listByClient(id),
    saleRepository.list({ clientId: id })
  ]);

  const openTicketBillings = ticketBillings.filter((b) => !["PAGO", "CANCELADO"].includes(b.financialStatus));
  const paidTicketBillings = ticketBillings.filter((b) => b.financialStatus === "PAGO");
  const openMonthly = monthlyBillings.filter((b) => b.financialStatus !== "PAGO" && b.financialStatus !== "CANCELADO");
  const paidMonthly = monthlyBillings.filter((b) => b.financialStatus === "PAGO");
  const openSales = sales.filter((s) => !["PAGO", "CANCELADO"].includes(s.financialStatus));
  const paidSales = sales.filter((s) => s.financialStatus === "PAGO");

  const totalOpen =
    openTicketBillings.reduce((s, b) => s + b.totalAmount, 0) +
    openMonthly.reduce((s, b) => s + b.amount, 0) +
    openSales.reduce((s, b) => s + b.totalAmount, 0);
  const totalPaid =
    paidTicketBillings.reduce((s, b) => s + b.totalAmount, 0) +
    paidMonthly.reduce((s, b) => s + b.amount, 0) +
    paidSales.reduce((s, b) => s + b.totalAmount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Extrato financeiro — ${client.name}`}
        description="Cobranças de chamados e mensalidades de contrato."
        action={
          <Link href={`/clientes/${id}` as Route} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
            ← Voltar ao cliente
          </Link>
        }
      />

      {/* Cards de resumo */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-yellow-700">Em aberto</p>
          <p className="mt-2 text-2xl font-semibold text-yellow-950">{formatCurrency(totalOpen)}</p>
          <p className="mt-1 text-xs text-yellow-600">
            {openTicketBillings.length + openMonthly.length} cobranças pendentes
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Recebido (histórico)</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-950">{formatCurrency(totalPaid)}</p>
          <p className="mt-1 text-xs text-emerald-600">
            {paidTicketBillings.length + paidMonthly.length} cobranças pagas
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total de registros</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{ticketBillings.length + monthlyBillings.length + sales.length}</p>
          <p className="mt-1 text-xs text-slate-400">chamados + mensalidades + vendas</p>
        </div>
      </section>

      {/* Mensalidades de contrato */}
      {monthlyBillings.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Mensalidades de contrato</h2>
          <MonthlyBillingList clientId={id} initialBillings={monthlyBillings} />
        </section>
      )}

      {/* Vendas */}
      {sales.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Vendas</h2>
          <div className="space-y-2">
            <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-4 px-4 text-xs font-semibold uppercase tracking-wide text-slate-400 lg:grid">
              <span>Nº / Data</span>
              <span>Itens</span>
              <span>Status</span>
              <span>Valor</span>
              <span>Pagamento</span>
            </div>
            {sales.map((sale) => (
              <Link
                key={sale.id}
                href={`/vendas/${sale.id}` as Route}
                className="block rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50"
              >
                {/* Mobile */}
                <div className="lg:hidden space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-slate-500">{sale.number}</p>
                      <p className="font-semibold text-slate-950">{formatCurrency(sale.totalAmount)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[sale.financialStatus]}`}>
                      {statusLabel[sale.financialStatus]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {sale.items.length} {sale.items.length === 1 ? "item" : "itens"} · {formatDate(sale.createdAt)}
                    {sale.paymentMethod ? ` · ${sale.paymentMethod}` : ""}
                  </p>
                </div>
                {/* Desktop */}
                <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_1fr] items-center gap-4 lg:grid">
                  <div>
                    <p className="text-xs text-slate-500">{sale.number}</p>
                    <p className="text-sm text-slate-700">{formatDate(sale.createdAt)}</p>
                  </div>
                  <p className="text-sm text-slate-700">
                    {sale.items.length} {sale.items.length === 1 ? "item" : "itens"}
                  </p>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[sale.financialStatus]}`}>
                    {statusLabel[sale.financialStatus]}
                  </span>
                  <p className="text-sm font-semibold text-slate-950">{formatCurrency(sale.totalAmount)}</p>
                  <p className="text-sm text-slate-500">{sale.paymentMethod ?? "—"}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Cobranças de chamados */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Cobranças de chamados</h2>
        {ticketBillings.length > 0 ? (
          <div className="space-y-2">
            <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-4 text-xs font-semibold uppercase tracking-wide text-slate-400 lg:grid">
              <span>Chamado</span>
              <span>Tipo</span>
              <span>Status</span>
              <span>Valor</span>
              <span>Atualizado</span>
            </div>
            {ticketBillings.map((billing) => (
              <Link
                key={billing.id}
                href={`/chamados/${billing.ticketId}` as Route}
                className="block rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50"
              >
                {/* Mobile */}
                <div className="lg:hidden space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-slate-500">{billing.ticketNumber}</p>
                      <p className="font-semibold text-slate-950">{billing.ticketTitle}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[billing.financialStatus]}`}>
                      {statusLabel[billing.financialStatus]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {billingTypeLabel[billing.billingType]} · {formatCurrency(billing.totalAmount)} · {formatDate(billing.updatedAt)}
                  </p>
                </div>
                {/* Desktop */}
                <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-4 lg:grid">
                  <div>
                    <p className="text-xs text-slate-500">{billing.ticketNumber}</p>
                    <p className="font-semibold text-slate-950">{billing.ticketTitle}</p>
                  </div>
                  <p className="text-sm text-slate-700">{billingTypeLabel[billing.billingType]}</p>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[billing.financialStatus]}`}>
                    {statusLabel[billing.financialStatus]}
                  </span>
                  <p className="text-sm font-semibold text-slate-950">{formatCurrency(billing.totalAmount)}</p>
                  <p className="text-sm text-slate-500">{formatDate(billing.updatedAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="Nenhuma cobrança de chamado" description="Este cliente não tem cobranças registradas." />
        )}
      </section>
    </div>
  );
}
