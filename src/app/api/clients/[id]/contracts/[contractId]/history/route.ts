import { NextResponse } from "next/server";

import { requireApiUser } from "@/server/auth/api-guard";
import { contractRepository } from "@/server/repositories/contract-repository";

export async function GET(_: Request, context: { params: Promise<{ id: string; contractId: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
    if ("error" in guard) return guard.error;

    const { contractId } = await context.params;
    const data = await contractRepository.findHistoryByContractId(contractId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao buscar histórico." },
      { status: 500 }
    );
  }
}
