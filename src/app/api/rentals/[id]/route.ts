import { NextResponse } from "next/server";

import { requireApiUser } from "@/server/auth/api-guard";
import { rentalService } from "@/server/services/rental-service";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
  if ("error" in guard) return guard.error;

  const { id } = await context.params;
  const contract = await rentalService.getContract(id);
  if (!contract) return NextResponse.json({ success: false, message: "Contrato não encontrado." }, { status: 404 });
  return NextResponse.json({ success: true, data: contract });
}
