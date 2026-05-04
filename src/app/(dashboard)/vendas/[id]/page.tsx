import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { SaleActions } from "@/components/sales/sale-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requireRole } from "@/server/auth/session";
import { saleService } from "@/server/services/sale-service";

const statusBadge: Record<string, { label: string; className: string }> = {
  PENDENTE:  { label: "Pendente",  className: "bg-amber-100 text-amber-800" },
  PAGO:      { label: "Pago",      className: "bg-green-100 text-green-800 font-semibold" },
  CANCELADO: { label: "Cancelado", className: "bg-rose-100 text-rose-700" }
};

export default async function VendaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["ADMIN", "ATTENDANT"]);
  const { id } = await params;
  const sale = await saleService.getSale(id);
  if (!sale) notFound();

  const badge = statusBadge[sale.financialStatus] ?? statusBadge.PENDENTE;
  const isActive = sale.financialStatus === "PENDENTE";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Venda ${sale.number}`}
        description={`Cliente: ${sale.clientName}`}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.7fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Itens vendidos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-6 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span>Peça</span><span>Qtd</span><span>Unit.</span><span className="text-right">Total</span>
                </div>
                {sale.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-6 py-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{item.partName}</p>
                      {item.partCode && <p className="text-xs text-slate-400">{item.partCode}</p>}
                    </div>
                    <span className="text-slate-600">{item.quantity}</span>
                    <span className="text-slate-600">{formatCurrency(item.unitPrice)}</span>
                    <span className="text-right font-semibold text-slate-950">{formatCurrency(item.totalPrice)}</span>
                  </div>
                ))}
                <div className="flex justify-between px-6 py-3 bg-slate-50">
                  <span className="text-sm font-semibold text-slate-700">Total</span>
                  <span className="text-sm font-semibold text-slate-950">{formatCurrency(sale.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {sale.internalNotes && (
            <Card>
              <CardContent className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Observações</p>
                <p className="text-sm text-slate-700">{sale.internalNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Situação financeira</CardTitle></CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Status</span>
                <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${badge.className}`}>
                  {badge.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total</span>
                <span className="font-semibold text-slate-950">{formatCurrency(sale.totalAmount)}</span>
              </div>
              {sale.paymentMethod && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Forma pgto.</span>
                  <span className="text-sm text-slate-900">{sale.paymentMethod}</span>
                </div>
              )}
              {sale.paymentDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Data pgto.</span>
                  <span className="text-sm text-slate-900">{formatDate(sale.paymentDate)}</span>
                </div>
              )}
              {sale.paymentReference && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Referência</span>
                  <span className="text-sm text-slate-900">{sale.paymentReference}</span>
                </div>
              )}
              {sale.cancellationReason && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                  <p className="text-xs font-semibold text-rose-700">Motivo do cancelamento</p>
                  <p className="mt-0.5 text-sm text-rose-800">{sale.cancellationReason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {isActive && <SaleActions saleId={sale.id} />}

          <Card>
            <CardContent className="p-6 space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Aberta em</span>
                <span>{formatDate(sale.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Registrada por</span>
                <span>{sale.createdByName}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
