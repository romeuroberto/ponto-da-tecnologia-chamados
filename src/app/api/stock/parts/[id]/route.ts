import { NextResponse } from "next/server";

import { requireApiUser } from "@/server/auth/api-guard";
import { saleService } from "@/server/services/sale-service";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiUser(["ADMIN"]);
  if ("error" in guard) return guard.error;

  const { id } = await params;

  try {
    await saleService.deletePart(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível excluir o material.";
    return NextResponse.json({ success: false, message }, { status: 409 });
  }
}
