import type { Route } from "next";
import Link from "next/link";

import { PortalDocumentList } from "@/components/portal/portal-document-list";
import { PortalPaymentInstructions } from "@/components/portal/portal-payment-instructions";
import { financialStatusClass, financialStatusLabel } from "@/lib/portal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requirePortalUser } from "@/server/auth/session";
import { portalService } from "@/server/services/portal-service";

export default async function PortalAppFinancialPage() {
  const user = await requirePortalUser();
  const { records, documents, paymentInstructions, summary } = await portalService.listFinancialRecords(user.clientId);

  return (
    <div className="space-y-5">
      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Financeiro</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">Resumo financeiro</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Valores pendentes, vencimentos e documentos em uma tela mais direta.</p>

        <div className="mt-5 grid grid-cols-1 gap-3">
          <div className="rounded-[1.4rem] bg-amber-50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-amber-700">Em aberto</p>
            <p className="mt-2 text-2xl font-semibold text-amber-950">{formatCurrency(summary.pendingAmount)}</p>
            <p className="mt-1 text-sm text-amber-800">{summary.pendingCount} lançamento(s) aguardando.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[1.4rem] bg-rose-50 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-rose-700">Vencido</p>
              <p className="mt-2 text-lg font-semibold text-rose-950">{formatCurrency(summary.overdueAmount)}</p>
            </div>
            <div className="rounded-[1.4rem] bg-emerald-50 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-700">Pago</p>
              <p className="mt-2 text-lg font-semibold text-emerald-950">{formatCurrency(summary.paidAmount)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Lançamentos</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Cobranças recentes</h2>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {records.length > 0 ? (
            records.map((record) => {
              const href =
                record.kind === "ticket"
                  ? (`/portal-app/chamados/${record.id}` as Route)
                  : record.kind === "sale"
                    ? (`/portal-app/vendas/${record.id}` as Route)
                    : null;
              const typeLabel =
                record.kind === "ticket"
                  ? "Chamado"
                  : record.kind === "sale"
                    ? "Venda"
                    : record.kind === "monthly-billing"
                      ? "Mensalidade"
                      : "Locação";
              const content = (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {typeLabel} · {record.number}
                    </p>
                    <p className="mt-1 truncate font-semibold text-slate-950">{record.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {record.dueDate ? `Vencimento em ${formatDate(record.dueDate)} · ` : ""}
                      {formatDate(record.createdAt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${financialStatusClass[record.status]}`}>
                      {financialStatusLabel[record.status]}
                    </span>
                    <p className="mt-2 text-sm font-semibold text-slate-950">{formatCurrency(record.totalAmount)}</p>
                  </div>
                </div>
              );

              if (!href) {
                return (
                  <div key={`${record.kind}-${record.id}`} className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4">
                    {content}
                  </div>
                );
              }

              return (
                <Link
                  key={`${record.kind}-${record.id}`}
                  href={href}
                  className="block rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4 transition hover:border-sky-200 hover:bg-sky-50/50"
                >
                  {content}
                </Link>
              );
            })
          ) : (
            <p className="rounded-[1.5rem] bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Nenhum lançamento financeiro disponível.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Dados para pagamento</h2>
        <div className="mt-4">
          <PortalPaymentInstructions instructions={paymentInstructions} />
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-950">Documentos fiscais</h2>
          <Link href={"/portal-app/documentos" as Route} className="text-sm font-semibold text-sky-700">
            Ver todos
          </Link>
        </div>
        <div className="mt-4">
          <PortalDocumentList documents={documents.slice(0, 5)} />
        </div>
      </section>
    </div>
  );
}
