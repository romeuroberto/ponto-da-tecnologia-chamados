import { PageHeader } from "@/components/layout/page-header";
import { StockEntryForm } from "@/components/sales/stock-entry-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import { requireRole } from "@/server/auth/session";
import { saleService } from "@/server/services/sale-service";

const movementTypeLabel: Record<string, string> = {
  ENTRY: "Entrada",
  SALE_EXIT: "Saída (venda)",
  SERVICE_ORDER_EXIT: "Saída (OS)",
  ADJUSTMENT: "Ajuste"
};

const movementTypeClass: Record<string, string> = {
  ENTRY: "text-emerald-700",
  SALE_EXIT: "text-rose-600",
  SERVICE_ORDER_EXIT: "text-orange-600",
  ADJUSTMENT: "text-slate-600"
};

export default async function EstoquePage() {
  const user = await requireRole(["ADMIN", "ATTENDANT"]);
  const isAdmin = user.role === "ADMIN";

  const [parts, movements] = await Promise.all([
    saleService.getStockOverview(),
    saleService.listMovements()
  ]);

  const lowStock = parts.filter((p) => p.active && p.stockQuantity <= 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estoque"
        description="Posição atual de peças e histórico de movimentações."
      />

      {lowStock.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-sm font-semibold text-rose-700">
            {lowStock.length} peça(s) com estoque zerado ou negativo:{" "}
            <span className="font-normal">{lowStock.map((p) => p.name).join(", ")}</span>
          </p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.5fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Posição atual</CardTitle></CardHeader>
            <CardContent className="p-0">
              {parts.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-6 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span>Peça</span><span>Código</span><span className="text-right">Preço unit.</span><span className="text-right">Em estoque</span>
                  </div>
                  {parts.filter((p) => p.active).map((part) => (
                    <div key={part.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-3 px-6 py-3 text-sm">
                      <span className="font-medium text-slate-900">{part.name}</span>
                      <span className="text-slate-500">{part.code ?? "—"}</span>
                      <span className="text-right text-slate-600">{formatCurrency(part.unitPrice)}</span>
                      <span className={`text-right font-semibold ${part.stockQuantity > 0 ? "text-slate-950" : "text-rose-600"}`}>
                        {Number(part.stockQuantity)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6">
                  <EmptyState title="Sem peças cadastradas" description="Cadastre peças no módulo de Catálogos." />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Últimas movimentações</CardTitle></CardHeader>
            <CardContent className="p-0">
              {movements.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-6 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span>Peça</span><span>Tipo</span><span className="text-right">Qtd</span><span className="text-right">Data</span>
                  </div>
                  {movements.map((m) => (
                    <div key={m.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-3 px-6 py-3 text-sm">
                      <span className="font-medium text-slate-900">{m.partName}</span>
                      <span className={`text-xs font-semibold ${movementTypeClass[m.type] ?? "text-slate-600"}`}>
                        {movementTypeLabel[m.type] ?? m.type}
                      </span>
                      <span className={`text-right font-semibold ${["ENTRY", "ADJUSTMENT"].includes(m.type) ? "text-emerald-700" : "text-rose-600"}`}>
                        {["ENTRY", "ADJUSTMENT"].includes(m.type) ? "+" : "-"}{Number(m.quantity)}
                      </span>
                      <span className="text-right text-slate-500">{new Date(m.createdAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6">
                  <EmptyState title="Sem movimentações" description="As entradas e saídas aparecerão aqui." />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {isAdmin && (
          <div>
            <StockEntryForm parts={parts.filter((p) => p.active)} />
          </div>
        )}
      </div>
    </div>
  );
}
