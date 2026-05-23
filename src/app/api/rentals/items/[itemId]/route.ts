import { NextResponse } from "next/server";

import { requireApiUser } from "@/server/auth/api-guard";
import { rentalService } from "@/server/services/rental-service";

export async function PATCH(req: Request, context: { params: Promise<{ itemId: string }> }) {
  const guard = await requireApiUser(["ADMIN"]);
  if ("error" in guard) return guard.error;

  const { itemId } = await context.params;

  try {
    const body = await req.json();
    const newPrice = Number(body.monthlyPrice);
    const updateBillings = body.updateBillings === true;

    if (!newPrice || newPrice <= 0) {
      return NextResponse.json({ success: false, message: "Valor inválido." }, { status: 400 });
    }

    const contract = await rentalService.updateItemPrice(itemId, newPrice, updateBillings);
    if (!contract) {
      return NextResponse.json({ success: false, message: "Item não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ success: true, contract });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Erro ao corrigir valor." },
      { status: 500 }
    );
  }
}

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
