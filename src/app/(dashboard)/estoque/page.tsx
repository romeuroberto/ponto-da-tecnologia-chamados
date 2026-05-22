import { PageHeader } from "@/components/layout/page-header";
import { StockEntryForm } from "@/components/sales/stock-entry-form";
import { StockAdjustmentForm } from "@/components/sales/stock-adjustment-form";
import { StockPartsTable } from "@/components/sales/stock-parts-table";
import { StockMovementsFilters } from "@/components/sales/stock-movements-filters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { formatCurrency } from "@/lib/utils";
import { requireRole } from "@/server/auth/session";
import { getParam } from "@/server/search-params";
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

export default async function EstoquePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireRole(["ADMIN", "ATTENDANT"]);
  const isAdmin = user.role === "ADMIN";

  const params = await searchParams;
  const movType = getParam(params.type) ?? "";
  const movPartId = getParam(params.partId) ?? "";
  const movFrom = getParam(params.from) ?? "";
  const movTo = getParam(params.to) ?? "";
  const movPage = Number(getParam(params.movPage) ?? "1");

  const [parts, { movements, totalPages }] = await Promise.all([
    saleService.getStockOverview(),
    saleService.listMovements({
      type: movType || undefined,
      partId: movPartId || undefined,
      from: movFrom || undefined,
      to: movTo || undefined,
      page: movPage,
      perPage: 50
    })
  ]);

  const activeParts = parts.filter((p) => p.active);

  const lowStockParts = activeParts.filter((p) => {
    if (p.minimumStock != null) return p.stockQuantity <= p.minimumStock;
    return p.stockQuantity <= 0;
  });

  const zeroStockParts = activeParts.filter((p) => p.stockQuantity <= 0);
  const totalInventoryValue = activeParts.reduce(
    (sum, p) => sum + p.stockQuantity * p.unitPrice,
    0
  );

  const movParams = {
    type: movType || undefined,
    partId: movPartId || undefined,
    from: movFrom || undefined,
    to: movTo || undefined
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estoque"
        description="Posição atual de materiais e histórico de movimentações."
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Materiais ativos</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{activeParts.length}</p>
        </div>
        <div className={`rounded-xl border px-4 py-3 ${zeroStockParts.length > 0 ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${zeroStockParts.length > 0 ? "text-rose-600" : "text-slate-400"}`}>
            Sem estoque
          </p>
          <p className={`mt-1 text-2xl font-semibold ${zeroStockParts.length > 0 ? "text-rose-950" : "text-slate-950"}`}>
            {zeroStockParts.length}
          </p>
        </div>
        <div className={`rounded-xl border px-4 py-3 ${lowStockParts.length > zeroStockParts.length ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${lowStockParts.length > zeroStockParts.length ? "text-amber-600" : "text-slate-400"}`}>
            Abaixo do mínimo
          </p>
          <p className={`mt-1 text-2xl font-semibold ${lowStockParts.length > zeroStockParts.length ? "text-amber-950" : "text-slate-950"}`}>
            {lowStockParts.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Valor em estoque</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{formatCurrency(totalInventoryValue)}</p>
        </div>
      </div>

      {/* Alert for zero stock */}
      {zeroStockParts.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-sm font-semibold text-rose-700">
            {zeroStockParts.length} material(is) com estoque zerado ou negativo:{" "}
            <span className="font-normal">{zeroStockParts.map((p) => p.name).join(", ")}</span>
          </p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.5fr]">
        <div className="space-y-6">

          {/* Current stock table */}
          <Card>
            <CardHeader><CardTitle>Posição atual</CardTitle></CardHeader>
            <CardContent className="p-0">
              {activeParts.length > 0 ? (
                <StockPartsTable parts={parts} isAdmin={isAdmin} />
              ) : (
                <div className="p-6">
                  <EmptyState title="Sem materiais cadastrados" description="Cadastre materiais no módulo de Catálogos." />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Movements history */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de movimentações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pb-4">
              <StockMovementsFilters
                parts={activeParts}
                defaults={{ type: movType, partId: movPartId, from: movFrom, to: movTo }}
              />

              {movements.length > 0 ? (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span>Material</span>
                    <span>Tipo</span>
                    <span className="text-right">Qtd</span>
                    <span>Responsável</span>
                    <span className="text-right">Data</span>
                  </div>
                  {movements.map((m) => (
                    <div key={m.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-start gap-3 px-4 py-3 text-sm">
                      <div>
                        <span className="font-medium text-slate-900">{m.partName}</span>
                        {m.notes && (
                          <p className="mt-0.5 text-xs text-slate-400">{m.notes}</p>
                        )}
                      </div>
                      <span className={`text-xs font-semibold ${movementTypeClass[m.type] ?? "text-slate-600"}`}>
                        {movementTypeLabel[m.type] ?? m.type}
                      </span>
                      <span className={`text-right font-semibold ${["ENTRY", "ADJUSTMENT"].includes(m.type) ? "text-emerald-700" : "text-rose-600"}`}>
                        {["ENTRY", "ADJUSTMENT"].includes(m.type) ? "+" : "-"}{Number(m.quantity)}
                      </span>
                      <span className="text-xs text-slate-500">{m.createdByName}</span>
                      <span className="text-right text-slate-500">
                        {new Date(m.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="Sem movimentações" description="Nenhuma movimentação encontrada para os filtros aplicados." />
              )}

              {totalPages > 1 && (
                <PaginationControls
                  pathname="/estoque"
                  page={movPage}
                  totalPages={totalPages}
                  params={{ ...movParams, movPage: undefined }}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {isAdmin && (
          <div className="space-y-4">
            <StockEntryForm parts={activeParts} />
            <StockAdjustmentForm parts={activeParts} />
          </div>
        )}
      </div>
    </div>
  );
}
