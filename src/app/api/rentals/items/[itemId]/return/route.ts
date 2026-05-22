import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/server/auth/api-guard";
import { rentalService } from "@/server/services/rental-service";

const schema = z.object({
  returnedAt: z.string().min(1)
});

export async function PATCH(req: Request, context: { params: Promise<{ itemId: string }> }) {
  const guard = await requireApiUser(["ADMIN"]);
  if ("error" in guard) return guard.error;

  const { itemId } = await context.params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Data de devolução inválida." }, { status: 400 });
  }

  try {
    const updated = await rentalService.returnItem(itemId, parsed.data.returnedAt);
    if (!updated) return NextResponse.json({ success: false, message: "Item não encontrado." }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return NextResponse.json({ success: false, message: err instanceof Error ? err.message : "Erro." }, { status: 500 });
  }
}
