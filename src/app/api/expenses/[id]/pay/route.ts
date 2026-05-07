import { NextResponse } from "next/server";

import { expensePaySchema } from "@/lib/validations/expense";
import { requireApiUser } from "@/server/auth/api-guard";
import { expenseService } from "@/server/services/expense-service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const body = await req.json();
  const parsed = expensePaySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Dados invalidos para registrar pagamento.", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const expense = await expenseService.payExpense(id, parsed.data, guard.user.id);
    return NextResponse.json({ success: true, data: expense });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao pagar despesa." },
      { status: 400 }
    );
  }
}
