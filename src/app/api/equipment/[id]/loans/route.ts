import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/server/auth/api-guard";
import { rentalService } from "@/server/services/rental-service";

const createSchema = z.object({
  mainEquipmentId: z.string().optional(),
  clientId: z.string().min(1),
  loanedAt: z.string().min(1),
  notes: z.string().optional()
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
  if ("error" in guard) return guard.error;

  const { id: reserveEquipmentId } = await params;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Dados inválidos.", errors: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const loan = await rentalService.createLoan({
      reserveEquipmentId,
      ...parsed.data,
      createdById: guard.user.id
    });
    return NextResponse.json({ success: true, data: loan }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err instanceof Error ? err.message : "Erro ao registrar empréstimo." }, { status: 500 });
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const loans = await rentalService.listLoansByEquipment(id);
  return NextResponse.json({ success: true, data: loans });
}
