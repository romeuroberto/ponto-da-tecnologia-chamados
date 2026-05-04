import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/server/auth/api-guard";
import { saleService } from "@/server/services/sale-service";

const updateStatusSchema = z.object({
  financialStatus: z.enum(["PAGO", "CANCELADO"]),
  paymentMethod: z.string().optional(),
  paymentDate: z.string().optional(),
  paymentReference: z.string().optional(),
  cancellationReason: z.string().optional()
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const sale = await saleService.getSale(id);
  if (!sale) return NextResponse.json({ success: false, message: "Venda não encontrada." }, { status: 404 });

  return NextResponse.json({ success: true, data: sale });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, errors: parsed.error.flatten() }, { status: 400 });
  }

  const sale = await saleService.updateSaleStatus(id, parsed.data);
  if (!sale) return NextResponse.json({ success: false, message: "Venda não encontrada." }, { status: 404 });

  return NextResponse.json({ success: true, data: sale });
}
