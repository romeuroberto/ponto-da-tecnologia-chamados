import { NextResponse } from "next/server";

import { clientComputerSchema } from "@/lib/validations/client-computer";
import { requireApiUser } from "@/server/auth/api-guard";
import { canManageClientComputers, canViewClientComputers } from "@/server/auth/permissions";
import { clientComputerService } from "@/server/services/client-computer-service";

function getStatusFromError(error: unknown) {
  if (!(error instanceof Error)) {
    return 500;
  }

  if (error.message.includes("não encontrado")) {
    return 404;
  }

  return 500;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT", "TECHNICIAN"]);

    if ("error" in guard) {
      return guard.error;
    }

    if (!canViewClientComputers(guard.user.role)) {
      return NextResponse.json({ success: false, message: "Sem permissão para visualizar computadores." }, { status: 403 });
    }

    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true" && canManageClientComputers(guard.user.role);
    const data = await clientComputerService.listClientComputers(id, { includeInactive });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao listar computadores." },
      { status: getStatusFromError(error) }
    );
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);

    if ("error" in guard) {
      return guard.error;
    }

    if (!canManageClientComputers(guard.user.role)) {
      return NextResponse.json({ success: false, message: "Sem permissão para cadastrar computadores." }, { status: 403 });
    }

    const body = await request.json();
    const result = clientComputerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Dados inválidos para cadastrar computador.", errors: result.error.flatten() },
        { status: 400 }
      );
    }

    const { id } = await context.params;
    const data = await clientComputerService.createClientComputer(id, result.data);

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao cadastrar computador." },
      { status: getStatusFromError(error) }
    );
  }
}
