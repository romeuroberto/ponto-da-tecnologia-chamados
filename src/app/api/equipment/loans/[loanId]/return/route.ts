import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/server/auth/api-guard";
import { rentalService } from "@/server/services/rental-service";

const returnSchema = z.object({
  returnedAt: z.string().min(1)
});

export async function PATCH(req: Request, { params }: { params: Promise<{ loanId: string }> }) {
  const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
  if ("error" in guard) return guard.error;

  const { loanId } = await params;

  const body = await req.json();
  const parsed = returnSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Data de retorno inválida." }, { status: 400 });
  }

  try {
    const loan = await rentalService.registerLoanReturn(loanId, parsed.data.returnedAt);
    if (!loan) return NextResponse.json({ success: false, message: "Empréstimo não encontrado." }, { status: 404 });
    return NextResponse.json({ success: true, data: loan });
  } catch (err) {
    return NextResponse.json({ success: false, message: err instanceof Error ? err.message : "Erro ao registrar retorno." }, { status: 500 });
  }
}
