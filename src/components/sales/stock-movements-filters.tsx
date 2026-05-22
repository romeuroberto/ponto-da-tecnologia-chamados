"use client";

import type { PartCatalogItem } from "@/types";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Props {
  parts: PartCatalogItem[];
  defaults: {
    type: string;
    partId: string;
    from: string;
    to: string;
  };
}

export function StockMovementsFilters({ parts, defaults }: Props) {
  return (
    <form action="/estoque" className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="tab" value="movimentos" />

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-500">Material</label>
        <Select name="partId" defaultValue={defaults.partId} className="w-48">
          <option value="">Todos</option>
          {parts.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-500">Tipo</label>
        <Select name="type" defaultValue={defaults.type} className="w-44">
          <option value="">Todos os tipos</option>
          <option value="ENTRY">Entrada</option>
          <option value="SALE_EXIT">Saída (venda)</option>
          <option value="SERVICE_ORDER_EXIT">Saída (OS)</option>
          <option value="ADJUSTMENT">Ajuste</option>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-500">De</label>
        <Input name="from" type="date" defaultValue={defaults.from} className="w-36" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-500">Até</label>
        <Input name="to" type="date" defaultValue={defaults.to} className="w-36" />
      </div>

      <input type="hidden" name="movPage" value="1" />

      <div className="flex gap-2">
        <Button type="submit" variant="secondary" size="sm">Filtrar</Button>
        <Link href="/estoque?tab=movimentos">
          <Button type="button" variant="outline" size="sm">Limpar</Button>
        </Link>
      </div>
    </form>
  );
}
