import type { Route } from "next";
import Link from "next/link";

import { PortalDocumentList } from "@/components/portal/portal-document-list";
import { financialStatusClass, financialStatusLabel } from "@/lib/portal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requirePortalUser } from "@/server/auth/session";
import { portalService } from "@/server/services/portal-service";

export default async function PortalSalesPage() {
  const user = await requirePortalUser();
  const { sales, documents } = await portalService.listSales(user.clientId);

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Vendas</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Histórico de vendas</h1>
        <p className="mt-2 text-sm text-slate-500">Acompanhe produtos e materiais faturados para a sua empresa dentro do mesmo portal.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-semibold text-slate-900">Total de vendas</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{sales.length}</p>
          <p className="mt-2 text-sm text-slate-500">Registros comerciais vinculados ao cliente.</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
          <p className="text-sm font-semibold text-amber-900">Aguardando pagamento</p>
          <p className="mt-3 text-3xl font-semibold text-amber-950">
            {sales.filter((sale) => sale.financialStatus !== "PAGO" && sale.financialStatus !== "CANCELADO").length}
          </p>
          <p className="mt-2 text-sm text-amber-800">Vendas ainda não quitadas.</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
          <p className="text-sm font-semibold text-emerald-900">Recebido</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-950">
            {formatCurrency(sales.filter((sale) => sale.financialStatus === "PAGO").reduce((sum, sale) => sum + sale.totalAmount, 0))}
          </p>
          <p className="mt-2 text-sm text-emerald-800">Total de vendas com pagamento confirmado.</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-slate-950">Lançamentos de venda</h2>
        <div className="mt-6 space-y-3">
          {sales.length > 0 ? (
            sales.map((sale) => (
              <Link
                key={sale.id}
                href={`/portal/vendas/${sale.id}` as Route}
                className="block rounded-2xl border border-slate-200 p-4 transition-colors hover:border-sky-200 hover:bg-sky-50/40"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{sale.number}</p>
                    <p className="mt-1 font-semibold text-slate-950">{sale.items.length} item(s) · {sale.clientName}</p>
                    <p className="mt-1 text-sm text-slate-500">Criada em {formatDate(sale.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${financialStatusClass[sale.financialStatus]}`}>
                      {financialStatusLabel[sale.financialStatus]}
                    </span>
                    <p className="text-sm font-semibold text-slate-950">{formatCurrency(sale.totalAmount)}</p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
              Nenhuma venda disponível para este cliente até o momento.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-slate-950">Documentos vinculados</h2>
        <p className="mt-1 text-sm text-slate-500">Notas e documentos fiscais relacionados a vendas do cliente.</p>
        <div className="mt-6">
          <PortalDocumentList documents={documents.filter((document) => document.links.some((link) => link.saleId)).slice(0, 5)} />
        </div>
      </section>
    </div>
  );
}
