import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ClientStatementBatchPayment, type ClientStatementBatchPaymentItem } from "@/components/financial/client-statement-batch-payment";
import { ClientStatementQuickPayment } from "@/components/financial/client-statement-quick-payment";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { MonthlyBillingList } from "@/components/contracts/monthly-billing-list";
import { withReturnTo } from "@/lib/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requireRole } from "@/server/auth/session";
import { clientService } from "@/server/services/client-service";
import { billingRepository } from "@/server/repositories/billing-repository";
import { contractMonthlyBillingRepository } from "@/server/repositories/contract-monthly-billing-repository";
import { rentalRepository } from "@/server/repositories/rental-repository";
import { saleRepository } from "@/server/repositories/sale-repository";
import { fiscalDocumentService } from "@/server/services/fiscal-document-service";

const billingTypeLabel: Record<string, string> = {
  AVULSO: "Avulso",
  CONTRATO: "Contrato",
  GARANTIA: "Garantia",
  CORTESIA: "Cortesia"
};

const statusLabel: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_ANALISE: "Pendente de cobrança",
  APROVADO: "Pendente de cobrança",
  FATURADO: "Faturado",
  PAGO: "Pago",
  CANCELADO: "Cancelado"
};

const statusColor: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-800",
  EM_ANALISE: "bg-yellow-100 text-yellow-800",
  APROVADO: "bg-yellow-100 text-yellow-800",
  FATURADO: "bg-purple-100 text-purple-800",
  PAGO: "bg-slate-100 text-slate-600",
  CANCELADO: "bg-rose-100 text-rose-700"
};

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default async function ClientFinanceiroPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ver?: string }>;
}) {
  const currentUser = await requireRole(["ADMIN", "ATTENDANT"]);
  const { id } = await params;
  const { ver } = await searchParams;
  const showAll = ver === "tudo";

  const client = await clientService.getClient(id);
  if (!client) notFound();

  await contractMonthlyBillingRepository.generatePending(id);

  const [ticketBillings, monthlyBillings, sales, rentalBillings, fiscalDocuments] = await Promise.all([
    billingRepository.listByClient(id),
    contractMonthlyBillingRepository.listByClient(id),
    saleRepository.list({ clientId: id }),
    rentalRepository.listBillingsByClient(id),
    fiscalDocumentService.listByClient(id)
  ]);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const openTicketBillings = ticketBillings.filter((b) => !["PAGO", "CANCELADO"].includes(b.financialStatus));
  const paidTicketBillings = ticketBillings.filter((b) => b.financialStatus === "PAGO");
  const openMonthly = monthlyBillings.filter((b) => b.financialStatus !== "PAGO" && b.financialStatus !== "CANCELADO");
  const paidMonthly = monthlyBillings.filter((b) => b.financialStatus === "PAGO");
  const openSales = sales.filter((s) => !["PAGO", "CANCELADO"].includes(s.financialStatus));
  const paidSales = sales.filter((s) => s.financialStatus === "PAGO");
  const openRentals = rentalBillings.filter((b) => !["PAGO", "CANCELADO"].includes(b.financialStatus));
  const paidRentals = rentalBillings.filter((b) => b.financialStatus === "PAGO");

  const dueMonthly = openMonthly.filter(
    (b) => b.referenceYear < currentYear || (b.referenceYear === currentYear && b.referenceMonth <= currentMonth)
  );

  const totalOpenOther =
    openTicketBillings.reduce((s, b) => s + b.totalAmount, 0) +
    openSales.reduce((s, b) => s + b.totalAmount, 0) +
    openRentals.reduce((s, b) => s + b.amount, 0);
  const totalDueMonthly = dueMonthly.reduce((s, b) => s + b.amount, 0);
  const totalPaid =
    paidTicketBillings.reduce((s, b) => s + b.totalAmount, 0) +
    paidMonthly.reduce((s, b) => s + b.amount, 0) +
    paidSales.reduce((s, b) => s + b.totalAmount, 0) +
    paidRentals.reduce((s, b) => s + b.amount, 0);

  const visibleMonthly = showAll ? monthlyBillings : openMonthly;
  const visibleSales = showAll ? sales : openSales;
  const visibleTicketBillings = showAll ? ticketBillings : openTicketBillings;
  const visibleRentals = showAll ? rentalBillings : openRentals;
  const visibleMonthlyKey = visibleMonthly
    .map((billing) => `${billing.id}:${billing.financialStatus}:${billing.paidAt ?? ""}`)
    .join("|");

  const baseUrl = `/clientes/${id}/financeiro` as Route;
  const batchPaymentItems: ClientStatementBatchPaymentItem[] = [
    ...openSales
      .filter((sale) => sale.financialStatus === "PENDENTE")
      .map((sale) => ({
        kind: "sale" as const,
        id: sale.id,
        label: `Venda ${sale.number}`,
        detail: `${sale.items.length} ${sale.items.length === 1 ? "item" : "itens"} · ${formatDate(sale.createdAt)}`,
        amount: sale.totalAmount
      })),
    ...openTicketBillings.map((billing) => ({
      kind: "ticket-billing" as const,
      ticketId: billing.ticketId,
      label: `${billing.ticketNumber} · ${billing.ticketTitle}`,
      detail: `${billingTypeLabel[billing.billingType]} · ${statusLabel[billing.financialStatus]}`,
      amount: billing.totalAmount,
      billingType: billing.billingType,
      financialStatus: billing.financialStatus,
      ticketStatus: billing.ticketStatus
    })),
    ...openMonthly.map((billing) => ({
      kind: "monthly-billing" as const,
      id: billing.id,
      label: `Mensalidade ${monthNames[billing.referenceMonth - 1]}/${billing.referenceYear}`,
      detail: `Contrato ${billing.contractNumber}`,
        amount: billing.amount,
        financialStatus: billing.financialStatus
    })),
    ...(currentUser.role === "ADMIN"
      ? openRentals.map((billing) => ({
          kind: "rental-billing" as const,
          id: billing.id,
          label: `Locação ${monthNames[billing.referenceMonth - 1]}/${billing.referenceYear}`,
          detail: `Contrato ${billing.contractNumber}`,
          amount: billing.amount,
          financialStatus: billing.financialStatus
        }))
      : [])
  ];
  const fiscalDocumentOptions = fiscalDocuments.map((document) => ({
    id: document.id,
    label: `${document.type} ${document.number}${document.series ? `/${document.series}` : ""}`,
    detail: `${formatDate(document.issueDate)} · ${document.totalAmount !== undefined ? formatCurrency(document.totalAmount) : "sem valor"}`
  }));

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
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-yellow-700">Em aberto</p>
          <p className="mt-2 text-2xl font-semibold text-yellow-950">{formatCurrency(totalOpenOther)}</p>
          <p className="mt-1 text-xs text-yellow-600">
            {openTicketBillings.length + openSales.length + openRentals.length} cobranças pendentes
          </p>
        </div>
        <div className="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Mensalidades em aberto</p>
          <p className="mt-2 text-2xl font-semibold text-orange-950">{formatCurrency(totalDueMonthly)}</p>
          <p className="mt-1 text-xs text-orange-600">
            {dueMonthly.length} {dueMonthly.length === 1 ? "mensalidade" : "mensalidades"} vencida{dueMonthly.length === 1 ? "" : "s"} ou no mês atual
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Recebido (histórico)</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-950">{formatCurrency(totalPaid)}</p>
          <p className="mt-1 text-xs text-emerald-600">
            {paidTicketBillings.length + paidMonthly.length + paidSales.length} cobranças pagas
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total de registros</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{ticketBillings.length + monthlyBillings.length + sales.length + rentalBillings.length}</p>
          <p className="mt-1 text-xs text-slate-400">chamados + mensalidades + vendas + locações</p>
        </div>
      </section>

      {/* Barra de filtros */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <span className="text-sm font-medium text-slate-500 mr-1">Exibir:</span>
        <Link
          href={baseUrl}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${!showAll ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
        >
          Somente pendentes
        </Link>
        <Link
          href={`${baseUrl}?ver=tudo` as Route}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${showAll ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
        >
          Ver tudo (incluindo pagos)
        </Link>
      </div>

      <ClientStatementBatchPayment items={batchPaymentItems} fiscalDocuments={fiscalDocumentOptions} />

      {/* Mensalidades de contrato */}
      {visibleMonthly.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Mensalidades de contrato</h2>
          <MonthlyBillingList key={visibleMonthlyKey} clientId={id} initialBillings={visibleMonthly} />
        </section>
      )}

      {/* Locações */}
      {visibleRentals.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Locações</h2>
          <div className="space-y-2">
            <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-4 px-4 text-xs font-semibold uppercase tracking-wide text-slate-400 lg:grid">
              <span>Mês / Contrato</span>
              <span>Vencimento</span>
              <span>Status</span>
              <span>Valor</span>
              <span>Pagamento</span>
            </div>
            {visibleRentals.map((billing) => (
              <div key={billing.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <Link
                  href={withReturnTo(`/locacoes/${billing.rentalContractId}`, baseUrl) as Route}
                  className="block p-4 transition-colors hover:bg-slate-50"
                >
                  <div className="space-y-1 lg:hidden">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-950">
                          {monthNames[billing.referenceMonth - 1]}/{billing.referenceYear}
                        </p>
                        <p className="text-xs text-slate-500">Contrato {billing.contractNumber}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[billing.financialStatus]}`}>
                        {statusLabel[billing.financialStatus]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {formatCurrency(billing.amount)}
                      {billing.dueDate ? ` · vence em ${formatDate(billing.dueDate)}` : ""}
                    </p>
                  </div>
                  <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_1fr] items-center gap-4 lg:grid">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {monthNames[billing.referenceMonth - 1]}/{billing.referenceYear}
                      </p>
                      <p className="text-xs text-slate-500">Contrato {billing.contractNumber}</p>
                    </div>
                    <p className="text-sm text-slate-700">{billing.dueDate ? formatDate(billing.dueDate) : "—"}</p>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[billing.financialStatus]}`}>
                      {statusLabel[billing.financialStatus]}
                    </span>
                    <p className="text-sm font-semibold text-slate-950">{formatCurrency(billing.amount)}</p>
                    <p className="text-sm text-slate-500">{billing.paymentMethod ?? "—"}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Vendas */}
      {visibleSales.length > 0 && (
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
            {visibleSales.map((sale) => (
              <div
                key={sale.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <Link
                  href={withReturnTo(`/vendas/${sale.id}`, baseUrl) as Route}
                  className="block p-4 transition-colors hover:bg-slate-50"
                >
                  {/* Mobile */}
                  <div className="space-y-1 lg:hidden">
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
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[sale.financialStatus]}`}>
                      {statusLabel[sale.financialStatus]}
                    </span>
                    <p className="text-sm font-semibold text-slate-950">{formatCurrency(sale.totalAmount)}</p>
                    <p className="text-sm text-slate-500">{sale.paymentMethod ?? "—"}</p>
                  </div>
                </Link>
                {sale.financialStatus === "PENDENTE" ? (
                  <ClientStatementQuickPayment item={{ kind: "sale", id: sale.id, amount: sale.totalAmount }} />
                ) : null}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Cobranças de chamados */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Cobranças de chamados</h2>
        {visibleTicketBillings.length > 0 ? (
          <div className="space-y-2">
            <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-4 text-xs font-semibold uppercase tracking-wide text-slate-400 lg:grid">
              <span>Chamado</span>
              <span>Tipo</span>
              <span>Status</span>
              <span>Valor</span>
              <span>Atualizado</span>
            </div>
            {visibleTicketBillings.map((billing) => (
              <div
                key={billing.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <Link
                  href={withReturnTo(`/chamados/${billing.ticketId}`, baseUrl) as Route}
                  className="block p-4 transition-colors hover:bg-slate-50"
                >
                  {/* Mobile */}
                  <div className="space-y-1 lg:hidden">
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
                {!["PAGO", "CANCELADO"].includes(billing.financialStatus) ? (
                  <ClientStatementQuickPayment
                    item={{
                      kind: "ticket-billing",
                      ticketId: billing.ticketId,
                      amount: billing.totalAmount,
                      billingType: billing.billingType,
                      financialStatus: billing.financialStatus,
                      discountAmount: billing.discountAmount,
                      internalNotes: billing.internalNotes,
                      ticketStatus: billing.ticketStatus
                    }}
                  />
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={showAll ? "Nenhuma cobrança de chamado" : "Nenhuma cobrança pendente de chamado"}
            description={showAll ? "Este cliente não tem cobranças registradas." : "Todas as cobranças estão pagas."}
          />
        )}
      </section>
    </div>
  );
}
