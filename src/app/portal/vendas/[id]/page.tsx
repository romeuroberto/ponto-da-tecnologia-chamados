import Link from "next/link";
import { notFound } from "next/navigation";

import { PortalDocumentList } from "@/components/portal/portal-document-list";
import { PortalPaymentInstructions } from "@/components/portal/portal-payment-instructions";
import { financialStatusClass, financialStatusLabel } from "@/lib/portal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requirePortalUser } from "@/server/auth/session";
import { portalService } from "@/server/services/portal-service";

export default async function PortalSaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePortalUser();
  const { id } = await params;
  const data = await portalService.getSaleDetail(user.clientId, id);

  if (!data) {
    notFound();
  }

  const { sale, documents, paymentInstructions } = data;

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <Link href="/portal/vendas" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
          ← Voltar para vendas
        </Link>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{sale.number}</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">Venda para {sale.clientName}</h1>
            <p className="mt-2 text-sm text-slate-500">Registrada em {formatDate(sale.createdAt)}</p>
          </div>
          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${financialStatusClass[sale.financialStatus]}`}>
            {financialStatusLabel[sale.financialStatus]}
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Total da venda</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(sale.totalAmount)}</p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Itens</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{sale.items.length}</p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Pagamento</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{sale.paymentMethod ?? "Aguardando definição"}</p>
          </div>
        </div>

        <div className="mt-6 divide-y divide-slate-100 rounded-[1.5rem] border border-slate-200">
          {sale.items.map((item) => (
            <div key={item.id} className="grid gap-2 px-4 py-4 sm:px-5 md:grid-cols-[2fr_0.8fr_0.8fr_0.8fr]">
              <div>
                <p className="font-semibold text-slate-950">{item.partName}</p>
                {item.partCode ? <p className="text-xs text-slate-400">{item.partCode}</p> : null}
              </div>
              <p className="text-sm text-slate-600">Qtd: {item.quantity}</p>
              <p className="text-sm text-slate-600">Unit.: {formatCurrency(item.unitPrice)}</p>
              <p className="text-sm font-semibold text-slate-950 md:text-right">{formatCurrency(item.totalPrice)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-slate-950">Dados para pagamento</h2>
        <p className="mt-1 text-sm text-slate-500">Use estes dados se esta venda ainda estiver pendente.</p>
        <div className="mt-6">
          <PortalPaymentInstructions instructions={paymentInstructions} />
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-slate-950">Documentos relacionados</h2>
        <div className="mt-6">
          <PortalDocumentList documents={documents} />
        </div>
      </div>
    </div>
  );
}
