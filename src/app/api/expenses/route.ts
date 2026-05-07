import { NextResponse } from "next/server";

import { expenseSchema } from "@/lib/validations/expense";
import { requireApiUser } from "@/server/auth/api-guard";
import { expenseService } from "@/server/services/expense-service";
import type { ExpenseCategory, ExpenseStatus } from "@/types";

type ExpenseSort = "expense_desc" | "expense_asc" | "amount_desc" | "amount_asc" | "created_desc" | "created_asc";

export async function GET(req: Request) {
  const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
  if ("error" in guard) return guard.error;

  const { searchParams } = new URL(req.url);
  const data = await expenseService.listExpenses({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    status: (searchParams.get("status") as ExpenseStatus | null) ?? undefined,
    category: (searchParams.get("category") as ExpenseCategory | null) ?? undefined,
    ticketId: searchParams.get("ticketId") ?? undefined,
    linked: (searchParams.get("linked") as "linked" | "unlinked" | null) ?? undefined,
    query: searchParams.get("query") ?? undefined,
    sort: (searchParams.get("sort") as ExpenseSort | null) ?? undefined
  });

  return NextResponse.json({ success: true, data });
}

export async function POST(req: Request) {
  const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
  if ("error" in guard) return guard.error;

  const body = await req.json();
  const parsed = expenseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Dados invalidos para a despesa.", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const expense = await expenseService.createExpense({
      ...parsed.data,
      createdById: guard.user.id
    });
    return NextResponse.json({ success: true, data: expense }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao criar despesa." },
      { status: 400 }
    );
  }
}
