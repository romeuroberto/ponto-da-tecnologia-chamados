import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/server/auth/api-guard";
import { saleService } from "@/server/services/sale-service";

const entrySchema = z.object({
  partCatalogItemId: z.string().min(1),
  quantity: z.number().positive(),
  notes: z.string().optional()
});

export async function POST(req: Request) {
  const guard = await requireApiUser(["ADMIN"]);
  if ("error" in guard) return guard.error;

  const body = await req.json();
  const parsed = entrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, errors: parsed.error.flatten() }, { status: 400 });
  }

  await saleService.addStockEntry({ ...parsed.data, createdById: guard.user.id });
  return NextResponse.json({ success: true });
}
