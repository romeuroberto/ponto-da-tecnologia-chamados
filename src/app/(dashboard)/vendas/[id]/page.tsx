import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { SaleActions } from "@/components/sales/sale-actions";
import { SaleReceiptButton } from "@/components/sales/sale-receipt-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requireRole } from "@/server/auth/session";
import { saleService } from "@/server/services/sale-service";

const statusConfig: Record<string, { label: string; badgeCls: string; headerCls: string }> = {
  PENDENTE:  { label: "Pendente",  badgeCls: "bg-amber-100 text-amber-800",             headerCls: "border-amber-200 bg-amber-50" },
  PAGO:      { label: "Pago",      badgeCls: "bg-emerald-100 text-emerald-800 font-semibold", headerCls: "border-emerald-200 bg-emerald-50" },
  CANCELADO: { label: "Cancelado", badgeCls: "bg-rose-100 text-rose-700",               headerCls: "border-rose-200 bg-rose-50" }
};

export default async function VendaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["ADMIN", "ATTENDANT"]);
  const { id } = await params;
  const sale = await saleService.getSale(id);
  if (!sale) notFound();

  const cfg = statusConfig[sale.financialStatus] ?? statusConfig.PENDENTE;
  const isPending = sale.financialStatus === "PENDENTE";
  const isPaid = sale.financialStatus === "PAGO";
  const isCanceled = sale.financialStatus === "CANCELADO";

  return (
    <div className="space-y-6">
      <PageHeader title={`Venda ${sale.number}`} description={`Cliente: ${sale.clientName}`} />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.65fr]">

        {/* ── Left column ─────────────────────────────── */}
        <div className="space-y-6">

          {/* Items table */}
          <Card>
            <CardHeader>
              <CardTitle>Itens vendidos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                <div className="grid grid-cols-[2.5fr_0.8fr_1fr_1fr] gap-3 bg-slate-50 px-6 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span>Material</span>
                  <span>Qtd.</span>
                  <span>Unitário</span>
                  <span className="text-right">Total</span>
                </div>
                {sale.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-[2.5fr_0.8fr_1fr_1fr] gap-3 px-6 py-3.5 text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{item.partName}</p>
                      {item.partCode ? <p className="text-xs text-slate-400">{item.partCode}</p> : null}
                    </div>
                    <span className="text-slate-600 tabular-nums">{item.quantity}</span>
                    <span className="text-slate-600 tabular-nums">{formatCurrency(item.unitPrice)}</span>
                    <span className="text-right font-semibold tabular-nums text-slate-950">{formatCurrency(item.totalPrice)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between bg-slate-950 px-6 py-4">
                  <span className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Total</span>
                  <span className="text-xl font-bold text-white tabular-nums">{formatCurrency(sale.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {sale.internalNotes ? (
            <Card>
              <CardContent className="p-6">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Observações</p>
                <p className="text-sm leading-relaxed text-slate-700">{sale.internalNotes}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* ── Right sidebar ────────────────────────────── */}
        <div className="space-y-4">

          {/* Status card */}
          <Card className={cfg.headerCls}>
            <CardContent className="p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Situação</span>
                <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${cfg.badgeCls}`}>{cfg.label}</span>
              </div>
              {sale.paidAt ? (
                <p className="text-xs text-slate-500">Confirmado em {formatDate(sale.paidAt)}</p>
              ) : null}
              {sale.canceledAt ? (
                <p className="text-xs text-slate-500">Cancelado em {formatDate(sale.canceledAt)}</p>
              ) : null}
            </CardContent>
          </Card>

          {/* Payment info (when paid) */}
          {isPaid && sale.paymentMethod ? (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="p-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Pagamento recebido</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-emerald-600">Forma</p>
                    <p className="font-semibold text-emerald-900">{sale.paymentMethod}</p>
                  </div>
                  {sale.paymentDate ? (
                    <div>
                      <p className="text-xs text-emerald-600">Data</p>
                      <p className="font-semibold text-emerald-900">{formatDate(sale.paymentDate)}</p>
                    </div>
                  ) : null}
                  {sale.paymentReference ? (
                    <div className="col-span-2">
                      <p className="text-xs text-emerald-600">Referência</p>
                      <p className="font-semibold text-emerald-900">{sale.paymentReference}</p>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Cancellation reason */}
          {isCanceled && sale.cancellationReason ? (
            <Card className="border-rose-200 bg-rose-50">
              <CardContent className="p-5">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-rose-600">Motivo do cancelamento</p>
                <p className="text-sm text-rose-800">{sale.cancellationReason}</p>
              </CardContent>
            </Card>
          ) : null}

          {/* Actions */}
          {isPending ? <SaleActions saleId={sale.id} /> : null}

          {/* Receipt */}
          {isPaid ? (
            <Card>
              <CardHeader>
                <CardTitle>Recibo</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <SaleReceiptButton saleId={sale.id} />
              </CardContent>
            </Card>
          ) : null}

          {/* Metadata */}
          <Card>
            <CardContent className="p-5 space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Registrada em</span>
                <span className="font-medium text-slate-800">{formatDate(sale.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Registrada por</span>
                <span className="font-medium text-slate-800">{sale.createdByName}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
