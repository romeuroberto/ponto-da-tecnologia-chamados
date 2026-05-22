import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/server/auth/api-guard";
import { rentalService } from "@/server/services/rental-service";

const schema = z.object({
  financialStatus: z.enum(["PENDENTE", "PAGO", "CANCELADO"]),
  paymentMethod: z.string().optional(),
  paymentDate: z.string().optional(),
  paymentReference: z.string().optional()
});

export async function PATCH(req: Request, context: { params: Promise<{ billingId: string }> }) {
  const guard = await requireApiUser(["ADMIN"]);
  if ("error" in guard) return guard.error;

  const { billingId } = await context.params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Dados inválidos.", errors: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await rentalService.updateBillingStatus(billingId, parsed.data);
  if (!updated) return NextResponse.json({ success: false, message: "Cobrança não encontrada." }, { status: 404 });
  return NextResponse.json({ success: true, data: updated });
}
