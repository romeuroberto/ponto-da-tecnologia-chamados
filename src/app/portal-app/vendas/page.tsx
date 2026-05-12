import type { Route } from "next";
import Link from "next/link";

import { PortalDocumentList } from "@/components/portal/portal-document-list";
import { financialStatusClass, financialStatusLabel } from "@/lib/portal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requirePortalUser } from "@/server/auth/session";
import { portalService } from "@/server/services/portal-service";

export default async function PortalAppSalesPage() {
  const user = await requirePortalUser();
  const { sales, documents } = await portalService.listSales(user.clientId);

  const pendingSales = sales.filter((sale) => sale.financialStatus !== "PAGO" && sale.financialStatus !== "CANCELADO");
  const paidAmount = sales.filter((sale) => sale.financialStatus === "PAGO").reduce((sum, sale) => sum + sale.totalAmount, 0);

  return (
    <div className="space-y-5">
      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Vendas</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">Histórico comercial</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Materiais e produtos faturados para a sua empresa.</p>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-[1.4rem] bg-slate-50 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Total</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">{sales.length}</p>
          </div>
          <div className="rounded-[1.4rem] bg-amber-50 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-amber-700">Pendentes</p>
            <p className="mt-2 text-xl font-semibold text-amber-950">{pendingSales.length}</p>
          </div>
          <div className="rounded-[1.4rem] bg-emerald-50 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-700">Recebido</p>
            <p className="mt-2 text-sm font-semibold text-emerald-950">{formatCurrency(paidAmount)}</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        {sales.length > 0 ? (
          sales.map((sale) => (
            <Link
              key={sale.id}
              href={`/portal-app/vendas/${sale.id}` as Route}
              className="block rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-sky-200 hover:bg-sky-50/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{sale.number}</p>
                  <p className="mt-1 font-semibold text-slate-950">{sale.items.length} item(s)</p>
                  <p className="mt-1 text-sm text-slate-500">Criada em {formatDate(sale.createdAt)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${financialStatusClass[sale.financialStatus]}`}>
                    {financialStatusLabel[sale.financialStatus]}
                  </span>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{formatCurrency(sale.totalAmount)}</p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-[1.8rem] border border-slate-200 bg-white px-4 py-8 text-center shadow-sm">
            <p className="font-semibold text-slate-700">Nenhuma venda disponível</p>
            <p className="mt-1 text-sm text-slate-500">Os lançamentos comerciais aparecerão aqui quando existirem.</p>
          </div>
        )}
      </section>

      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Documentos vinculados</h2>
        <div className="mt-4">
          <PortalDocumentList documents={documents.filter((document) => document.links.some((link) => link.saleId)).slice(0, 5)} />
        </div>
      </section>
    </div>
  );
}
