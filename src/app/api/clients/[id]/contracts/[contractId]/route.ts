import { NextResponse } from "next/server";

import { contractSchema } from "@/lib/validations/contract";
import { requireApiUser } from "@/server/auth/api-guard";
import { canEditClient } from "@/server/auth/permissions";
import { contractRepository } from "@/server/repositories/contract-repository";

export async function GET(_: Request, context: { params: Promise<{ id: string; contractId: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
    if ("error" in guard) return guard.error;

    const { contractId } = await context.params;
    const data = await contractRepository.findById(contractId);
    if (!data) return NextResponse.json({ success: false, message: "Contrato não encontrado." }, { status: 404 });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao buscar contrato." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string; contractId: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
    if ("error" in guard) return guard.error;

    if (!canEditClient(guard.user.role)) {
      return NextResponse.json({ success: false, message: "Sem permissão para editar contratos." }, { status: 403 });
    }

    const { contractId } = await context.params;
    const body = await request.json();
    const result = contractSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Dados inválidos.", errors: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = await contractRepository.update(contractId, result.data);
    if (!data) return NextResponse.json({ success: false, message: "Contrato não encontrado." }, { status: 404 });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao atualizar contrato." },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string; contractId: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
    if ("error" in guard) return guard.error;

    if (!canEditClient(guard.user.role)) {
      return NextResponse.json({ success: false, message: "Sem permissão para excluir contratos." }, { status: 403 });
    }

    const { contractId } = await context.params;
    const deleted = await contractRepository.delete(contractId);
    if (!deleted) return NextResponse.json({ success: false, message: "Contrato não encontrado." }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao excluir contrato." },
      { status: 500 }
    );
  }
}
