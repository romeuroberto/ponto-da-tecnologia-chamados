import { NextResponse } from "next/server";

import { partCatalogItemUpdateSchema } from "@/lib/validations/catalog";
import { requireApiUser } from "@/server/auth/api-guard";
import { catalogService } from "@/server/services/catalog-service";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN"]);

    if ("error" in guard) {
      return guard.error;
    }

    const body = await request.json();
    const result = partCatalogItemUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Dados inválidos para atualizar peça.", errors: result.error.flatten() },
        { status: 400 }
      );
    }

    const { id } = await context.params;
    const data = await catalogService.updatePartItem(id, result.data);

    if (!data) {
      return NextResponse.json({ success: false, message: "Peça não encontrada." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao atualizar peça.";
    return NextResponse.json({ success: false, message }, { status: message.includes("já está em uso") ? 409 : 500 });
  }
}
