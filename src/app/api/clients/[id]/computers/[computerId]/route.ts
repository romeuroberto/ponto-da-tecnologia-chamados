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

export async function GET(_: Request, context: { params: Promise<{ id: string; computerId: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT", "TECHNICIAN"]);

    if ("error" in guard) {
      return guard.error;
    }

    if (!canViewClientComputers(guard.user.role)) {
      return NextResponse.json({ success: false, message: "Sem permissão para visualizar computador." }, { status: 403 });
    }

    const { id, computerId } = await context.params;
    const data = await clientComputerService.getClientComputer(id, computerId);

    if (!data) {
      return NextResponse.json({ success: false, message: "Computador não encontrado para este cliente." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao buscar computador." },
      { status: getStatusFromError(error) }
    );
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string; computerId: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);

    if ("error" in guard) {
      return guard.error;
    }

    if (!canManageClientComputers(guard.user.role)) {
      return NextResponse.json({ success: false, message: "Sem permissão para atualizar computadores." }, { status: 403 });
    }

    const body = await request.json();
    const result = clientComputerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Dados inválidos para atualizar computador.", errors: result.error.flatten() },
        { status: 400 }
      );
    }

    const { id, computerId } = await context.params;
    const data = await clientComputerService.updateClientComputer(id, computerId, result.data);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao atualizar computador." },
      { status: getStatusFromError(error) }
    );
  }
}
