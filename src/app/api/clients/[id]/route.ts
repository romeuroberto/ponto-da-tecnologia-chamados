import { NextResponse } from "next/server";

import { clientSchema } from "@/lib/validations/client";
import { requireApiUser } from "@/server/auth/api-guard";
import { clientService } from "@/server/services/client-service";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiUser();

  if ("error" in guard) {
    return guard.error;
  }

  const { id } = await context.params;
  const client = await clientService.getClient(id);

  if (!client) {
    return NextResponse.json(
      {
        success: false,
        message: "Cliente nao encontrado."
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: client
  });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);

    if ("error" in guard) {
      return guard.error;
    }

    const { id } = await context.params;
    const body = await request.json();
    const result = clientSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Dados invalidos para atualizar o cliente.",
          errors: result.error.flatten()
        },
        { status: 400 }
      );
    }

    const data = await clientService.updateClient(id, result.data);

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Falha ao atualizar cliente."
      },
      { status: 500 }
    );
  }
}
