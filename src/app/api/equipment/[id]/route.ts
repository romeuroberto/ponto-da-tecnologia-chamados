import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/server/auth/api-guard";
import { rentalService } from "@/server/services/rental-service";

const updateSchema = z.object({
  model: z.string().min(1).optional(),
  serialNumber: z.string().min(1).optional(),
  patrimonyCode: z.string().nullable().optional(),
  purchaseDate: z.string().nullable().optional(),
  purchaseCost: z.number().min(0).nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(["DISPONIVEL", "LOCADO", "MANUTENCAO", "BAIXADO"]).optional()
});

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiUser(["ADMIN"]);
  if ("error" in guard) return guard.error;

  const { id } = await context.params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Dados inválidos.", errors: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await rentalService.updateEquipment(id, parsed.data);
  if (!updated) return NextResponse.json({ success: false, message: "Equipamento não encontrado." }, { status: 404 });
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiUser(["ADMIN"]);
  if ("error" in guard) return guard.error;

  const { id } = await context.params;
  try {
    await rentalService.deleteEquipment(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, message: err instanceof Error ? err.message : "Erro ao excluir." }, { status: 409 });
  }
}
