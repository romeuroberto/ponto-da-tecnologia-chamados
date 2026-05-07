import { NextResponse } from "next/server";

import { requireApiUser } from "@/server/auth/api-guard";
import { toCsv } from "@/server/csv";
import { getParam } from "@/server/search-params";
import { reportService } from "@/server/services/report-service";

export async function GET(request: Request) {
  const authResult = await requireApiUser(["ADMIN", "ATTENDANT"]);

  if (authResult.error) {
    return authResult.error;
  }

  const { searchParams } = new URL(request.url);
  const from = getParam(searchParams.get("from") ?? undefined);
  const to = getParam(searchParams.get("to") ?? undefined);
  const rows = await reportService.getCashExpensesExport({
    from: from || undefined,
    to: to || undefined
  });
  const csv = toCsv(rows);

  return new NextResponse(`\uFEFF${csv}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="relatorio-caixa-despesas.csv"'
    }
  });
}
