import { NextResponse } from "next/server";

import { userSchema } from "@/lib/validations/user";
import { requireApiUser } from "@/server/auth/api-guard";
import { userService } from "@/server/services/user-service";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiUser(["ADMIN"]);

  if ("error" in guard) {
    return guard.error;
  }

  const { id } = await context.params;
  const user = await userService.getUser(id);

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: "Usuário não encontrado."
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: user
  });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN"]);

    if ("error" in guard) {
      return guard.error;
    }

    const { id } = await context.params;
    const body = await request.json();
    const result = userSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Dados invalidos para atualizar o usuario.",
          errors: result.error.flatten()
        },
        { status: 400 }
      );
    }

    const data = await userService.updateUser(id, result.data);

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Falha ao atualizar usuario."
      },
      { status: 500 }
    );
  }
}
