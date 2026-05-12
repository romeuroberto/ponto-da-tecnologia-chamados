import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/server/auth/api-guard";
import { contractMonthlyBillingRepository } from "@/server/repositories/contract-monthly-billing-repository";

const markPaidSchema = z.object({
  paymentMethod: z.string().min(1),
  paidAt: z.string().datetime({ offset: true }).or(z.string().date())
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
    if ("error" in guard) return guard.error;

    const { id } = await context.params;
    const body = await request.json();
    const result = markPaidSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Dados inválidos.", errors: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = await contractMonthlyBillingRepository.markAsPaid(id, result.data);
    if (!data) return NextResponse.json({ success: false, message: "Cobrança não encontrada." }, { status: 404 });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao registrar pagamento." },
      { status: 500 }
    );
  }
}
