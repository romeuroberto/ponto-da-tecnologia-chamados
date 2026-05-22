import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/server/auth/api-guard";
import { rentalService } from "@/server/services/rental-service";
import { rentalRepository } from "@/server/repositories/rental-repository";

const schema = z.object({
  referenceMonth: z.number().int().min(1).max(12),
  referenceYear: z.number().int().min(2020),
  amount: z.number().min(0),
  dueDate: z.string().optional(),
  notes: z.string().optional()
});

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiUser(["ADMIN"]);
  if ("error" in guard) return guard.error;

  const { id } = await context.params;
  const contract = await rentalService.getContract(id);
  if (!contract) return NextResponse.json({ success: false, message: "Contrato não encontrado." }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Dados inválidos.", errors: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const billing = await rentalRepository.createBilling({
      rentalContractId: id,
      clientId: contract.clientId,
      ...parsed.data,
      createdById: guard.user.id
    });
    return NextResponse.json({ success: true, data: billing }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao gerar cobrança.";
    const status = msg.includes("Unique constraint") ? 409 : 500;
    return NextResponse.json({ success: false, message: status === 409 ? "Já existe uma cobrança para este mês." : msg }, { status });
  }
}
