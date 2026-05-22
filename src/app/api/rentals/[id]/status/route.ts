import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/server/auth/api-guard";
import { rentalService } from "@/server/services/rental-service";

const schema = z.object({
  status: z.enum(["RASCUNHO", "ATIVO", "ENCERRADO", "EXPIRADO"])
});

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiUser(["ADMIN"]);
  if ("error" in guard) return guard.error;

  const { id } = await context.params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Status inválido." }, { status: 400 });
  }

  const updated = await rentalService.updateContractStatus(id, parsed.data.status);
  if (!updated) return NextResponse.json({ success: false, message: "Contrato não encontrado." }, { status: 404 });
  return NextResponse.json({ success: true, data: updated });
}
