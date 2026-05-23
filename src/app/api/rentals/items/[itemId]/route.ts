import { NextResponse } from "next/server";

import { requireApiUser } from "@/server/auth/api-guard";
import { rentalService } from "@/server/services/rental-service";

export async function DELETE(_: Request, context: { params: Promise<{ itemId: string }> }) {
  const guard = await requireApiUser(["ADMIN"]);
  if ("error" in guard) return guard.error;

  const { itemId } = await context.params;

  try {
    await rentalService.deleteItem(itemId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Erro ao remover item." },
      { status: 500 }
    );
  }
}
