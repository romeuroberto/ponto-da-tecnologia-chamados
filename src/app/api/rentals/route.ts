import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/server/auth/api-guard";
import { rentalService } from "@/server/services/rental-service";

const createSchema = z.object({
  contractNumber: z.string().min(1),
  clientId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  noticeDays: z.number().int().min(0).optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    equipmentId: z.string().min(1),
    monthlyPrice: z.number().min(0),
    installedAt: z.string().min(1),
    notes: z.string().optional()
  })).min(1)
});

export async function GET(req: Request) {
  const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
  if ("error" in guard) return guard.error;

  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;

  const contracts = await rentalService.listContracts({
    clientId,
    status: status as Parameters<typeof rentalService.listContracts>[0]["status"]
  });
  return NextResponse.json({ success: true, data: contracts });
}

export async function POST(req: Request) {
  const guard = await requireApiUser(["ADMIN"]);
  if ("error" in guard) return guard.error;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Dados inválidos.", errors: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const contract = await rentalService.createContract({ ...parsed.data, createdById: guard.user.id });
    return NextResponse.json({ success: true, data: contract }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err instanceof Error ? err.message : "Erro ao criar contrato." }, { status: 500 });
  }
}
