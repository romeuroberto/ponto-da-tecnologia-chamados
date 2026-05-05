import { NextResponse } from "next/server";

import { partCatalogItemSchema } from "@/lib/validations/catalog";
import { requireApiUser } from "@/server/auth/api-guard";
import { catalogService } from "@/server/services/catalog-service";

export async function GET() {
  const guard = await requireApiUser(["ADMIN", "ATTENDANT", "TECHNICIAN"]);

  if ("error" in guard) {
    return guard.error;
  }

  return NextResponse.json({
    success: true,
    data: await catalogService.listPartItems(guard.user.role === "ADMIN")
  });
}

export async function POST(request: Request) {
  try {
    const guard = await requireApiUser(["ADMIN"]);

    if ("error" in guard) {
      return guard.error;
    }

    const body = await request.json();
    const result = partCatalogItemSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Dados inválidos para cadastrar material.", errors: result.error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: await catalogService.createPartItem({ ...result.data, createdById: guard.user.id })
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao cadastrar material.";
    return NextResponse.json({ success: false, message }, { status: message.includes("já está em uso") ? 409 : 500 });
  }
}
