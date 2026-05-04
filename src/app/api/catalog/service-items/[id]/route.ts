import { NextResponse } from "next/server";

import { serviceCatalogItemSchema } from "@/lib/validations/catalog";
import { requireApiUser } from "@/server/auth/api-guard";
import { catalogService } from "@/server/services/catalog-service";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN"]);

    if ("error" in guard) {
      return guard.error;
    }

    const body = await request.json();
    const result = serviceCatalogItemSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Dados inválidos para atualizar serviço.", errors: result.error.flatten() },
        { status: 400 }
      );
    }

    const { id } = await context.params;
    const data = await catalogService.updateServiceItem(id, result.data);

    if (!data) {
      return NextResponse.json({ success: false, message: "Serviço não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao atualizar serviço.";
    return NextResponse.json({ success: false, message }, { status: message.includes("já está em uso") ? 409 : 500 });
  }
}
