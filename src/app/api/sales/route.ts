import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/server/auth/api-guard";
import { saleService } from "@/server/services/sale-service";
import type { FinancialStatus } from "@/types";

const createSaleSchema = z.object({
  clientId: z.string().min(1),
  internalNotes: z.string().optional(),
  items: z.array(z.object({
    partCatalogItemId: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().min(0)
  })).min(1, "Adicione ao menos um item")
});

export async function GET(req: Request) {
  const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
  if ("error" in guard) return guard.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as FinancialStatus | null;
  const clientId = searchParams.get("clientId") ?? undefined;

  const sales = await saleService.listSales({ financialStatus: status ?? undefined, clientId });
  return NextResponse.json({ success: true, data: sales });
}

export async function POST(req: Request) {
  const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
  if ("error" in guard) return guard.error;

  const body = await req.json();
  const parsed = createSaleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, errors: parsed.error.flatten() }, { status: 400 });
  }

  const sale = await saleService.createSale({ ...parsed.data, createdById: guard.user.id });
  return NextResponse.json({ success: true, data: sale }, { status: 201 });
}
