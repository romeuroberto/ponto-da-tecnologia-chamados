import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PortalDocumentList } from "@/components/portal/portal-document-list";
import { PortalPaymentInstructions } from "@/components/portal/portal-payment-instructions";
import { financialStatusClass, financialStatusLabel } from "@/lib/portal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requirePortalUser } from "@/server/auth/session";
import { portalService } from "@/server/services/portal-service";

export default async function PortalAppSaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePortalUser();
  const { id } = await params;
  const data = await portalService.getSaleDetail(user.clientId, id);

  if (!data) {
    notFound();
  }

  const { sale, documents, paymentInstructions } = data;

  return (
    <div className="space-y-5">
      <Link href={"/portal-app/vendas" as Route} className="inline-flex text-sm font-semibold text-sky-700">
        ← Voltar para vendas
      </Link>

      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{sale.number}</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">Venda para {sale.clientName}</h1>
            <p className="mt-2 text-sm text-slate-500">Registrada em {formatDate(sale.createdAt)}</p>
          </div>
          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${financialStatusClass[sale.financialStatus]}`}>
            {financialStatusLabel[sale.financialStatus]}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-[1.4rem] bg-slate-50 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Total</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{formatCurrency(sale.totalAmount)}</p>
          </div>
          <div className="rounded-[1.4rem] bg-slate-50 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Itens</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">{sale.items.length}</p>
          </div>
          <div className="rounded-[1.4rem] bg-slate-50 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Pagamento</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{sale.paymentMethod ?? "A definir"}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Itens da venda</h2>
        <div className="mt-4 space-y-3">
          {sale.items.map((item) => (
            <div key={item.id} className="rounded-[1.5rem] bg-slate-50 px-4 py-4">
              <p className="font-semibold text-slate-950">{item.partName}</p>
              {item.partCode ? <p className="mt-0.5 text-xs text-slate-400">{item.partCode}</p> : null}
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-slate-500">Qtd.</p>
                  <p className="font-semibold text-slate-900">{item.quantity}</p>
                </div>
                <div>
                  <p className="text-slate-500">Unit.</p>
                  <p className="font-semibold text-slate-900">{formatCurrency(item.unitPrice)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Total</p>
                  <p className="font-semibold text-slate-900">{formatCurrency(item.totalPrice)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Dados para pagamento</h2>
        <div className="mt-4">
          <PortalPaymentInstructions instructions={paymentInstructions} />
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Documentos relacionados</h2>
        <div className="mt-4">
          <PortalDocumentList documents={documents} />
        </div>
      </section>
    </div>
  );
}
