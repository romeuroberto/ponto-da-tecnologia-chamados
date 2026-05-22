import { NextResponse } from "next/server";

import { requireApiUser } from "@/server/auth/api-guard";
import { rentalService } from "@/server/services/rental-service";

export async function DELETE(_: Request, context: { params: Promise<{ billingId: string }> }) {
  const guard = await requireApiUser(["ADMIN"]);
  if ("error" in guard) return guard.error;

  const { billingId } = await context.params;
  try {
    await rentalService.deleteBilling(billingId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, message: err instanceof Error ? err.message : "Erro ao excluir cobrança." }, { status: 409 });
  }
}
