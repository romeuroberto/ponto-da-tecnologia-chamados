import type { Route } from "next";
import Link from "next/link";

import { PortalDocumentList } from "@/components/portal/portal-document-list";
import { PortalPaymentInstructions } from "@/components/portal/portal-payment-instructions";
import { financialStatusClass, financialStatusLabel } from "@/lib/portal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requirePortalUser } from "@/server/auth/session";
import { portalService } from "@/server/services/portal-service";

export default async function PortalFinancialPage() {
  const user = await requirePortalUser();
  const { records, documents, paymentInstructions, summary } = await portalService.listFinancialRecords(user.clientId);

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Financeiro</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Resumo financeiro</h1>
        <p className="mt-2 text-sm text-slate-500">Veja o que ainda está em aberto, o que já foi pago e os dados para quitação das cobranças.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 sm:p-6">
          <p className="text-sm font-semibold text-amber-900">Em aberto</p>
          <p className="mt-3 text-3xl font-semibold text-amber-950">{formatCurrency(summary.pendingAmount)}</p>
          <p className="mt-2 text-sm text-amber-800">{summary.pendingCount} lançamento(s) aguardando pagamento.</p>
        </div>
        <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-5 sm:p-6">
          <p className="text-sm font-semibold text-rose-900">Vencido</p>
          <p className="mt-3 text-3xl font-semibold text-rose-950">{formatCurrency(summary.overdueAmount)}</p>
          <p className="mt-2 text-sm text-rose-800">Cobranças faturadas sem baixa confirmada.</p>
        </div>
        <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
          <p className="text-sm font-semibold text-emerald-900">Já pago</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-950">{formatCurrency(summary.paidAmount)}</p>
          <p className="mt-2 text-sm text-emerald-800">Valores recebidos e registrados no sistema.</p>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Lançamentos</h2>
            <p className="mt-1 text-sm text-slate-500">Chamados e vendas com situação financeira disponível para consulta.</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {records.length > 0 ? (
            records.map((record) => {
              const href =
                record.kind === "ticket"
                  ? (`/portal/chamados/${record.id}` as Route)
                  : (`/portal/vendas/${record.id}` as Route);

              return (
                <Link
                  key={`${record.kind}-${record.id}`}
                  href={href}
                  className="block rounded-[1.5rem] border border-slate-200 p-4 transition-colors hover:border-sky-200 hover:bg-sky-50/40"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                        {record.kind === "ticket" ? "Chamado" : "Venda"} • {record.number}
                      </p>
                      <p className="mt-1 font-semibold text-slate-950">{record.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {record.dueDate ? `Vencimento em ${formatDate(record.dueDate)} • ` : ""}
                        Atualizado em {formatDate(record.createdAt)}
                        {record.documentCount > 0 ? ` • ${record.documentCount} documento(s)` : ""}
                      </p>
                    </div>

                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${financialStatusClass[record.status]}`}>
                        {financialStatusLabel[record.status]}
                      </span>
                      <p className="text-sm font-semibold text-slate-950">{formatCurrency(record.totalAmount)}</p>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 p-6 text-sm text-slate-500">
              Nenhum lançamento financeiro disponível no momento.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold text-slate-950">Dados para pagamento</h2>
          <p className="mt-1 text-sm text-slate-500">Copie a chave Pix, utilize o QR code ou os dados bancários abaixo.</p>
          <div className="mt-6">
            <PortalPaymentInstructions instructions={paymentInstructions} />
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold text-slate-950">Documentos fiscais</h2>
          <p className="mt-1 text-sm text-slate-500">Notas e documentos liberados vinculados a chamados, cobranças ou vendas.</p>
          <div className="mt-6">
            <PortalDocumentList documents={documents.slice(0, 5)} />
          </div>
        </div>
      </section>
    </div>
  );
}
