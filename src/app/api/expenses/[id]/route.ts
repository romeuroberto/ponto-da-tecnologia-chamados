import { NextResponse } from "next/server";

import { expenseSchema } from "@/lib/validations/expense";
import { requireApiUser } from "@/server/auth/api-guard";
import { expenseService } from "@/server/services/expense-service";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const body = await req.json();
  const parsed = expenseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Dados invalidos para a despesa.", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const expense = await expenseService.updateExpense(id, parsed.data, guard.user.id);
    return NextResponse.json({ success: true, data: expense });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao atualizar despesa." },
      { status: 400 }
    );
  }
}
