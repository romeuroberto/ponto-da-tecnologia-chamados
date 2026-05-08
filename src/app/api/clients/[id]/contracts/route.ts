import { NextResponse } from "next/server";

import { contractSchema } from "@/lib/validations/contract";
import { requireApiUser } from "@/server/auth/api-guard";
import { canEditClient } from "@/server/auth/permissions";
import { contractRepository } from "@/server/repositories/contract-repository";
import { clientService } from "@/server/services/client-service";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
    if ("error" in guard) return guard.error;

    const { id } = await context.params;
    const client = await clientService.getClient(id);
    if (!client) return NextResponse.json({ success: false, message: "Cliente não encontrado." }, { status: 404 });

    const data = await contractRepository.findByClientId(id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao listar contratos." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
    if ("error" in guard) return guard.error;

    if (!canEditClient(guard.user.role)) {
      return NextResponse.json({ success: false, message: "Sem permissão para criar contratos." }, { status: 403 });
    }

    const { id } = await context.params;
    const client = await clientService.getClient(id);
    if (!client) return NextResponse.json({ success: false, message: "Cliente não encontrado." }, { status: 404 });

    const body = await request.json();
    const result = contractSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Dados inválidos.", errors: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = await contractRepository.create(id, result.data);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao criar contrato." },
      { status: 500 }
    );
  }
}
