import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/server/auth/api-guard";
import { rentalService } from "@/server/services/rental-service";

const schema = z.object({
  equipmentId: z.string().min(1),
  monthlyPrice: z.number().min(0),
  installedAt: z.string().min(1),
  notes: z.string().optional()
});

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiUser(["ADMIN"]);
  if ("error" in guard) return guard.error;

  const { id } = await context.params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Dados inválidos.", errors: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const updated = await rentalService.addItem(id, parsed.data);
    if (!updated) return NextResponse.json({ success: false, message: "Contrato não encontrado." }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return NextResponse.json({ success: false, message: err instanceof Error ? err.message : "Erro." }, { status: 500 });
  }
}
