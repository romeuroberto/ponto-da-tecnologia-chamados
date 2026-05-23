import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/server/auth/api-guard";
import { rentalService } from "@/server/services/rental-service";
import type { EquipmentStatus } from "@/types";

const createSchema = z.object({
  model: z.string().min(1),
  serialNumber: z.string().min(1),
  patrimonyCode: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchaseCost: z.number().min(0).optional(),
  notes: z.string().optional()
});

export async function GET(req: Request) {
  const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
  if ("error" in guard) return guard.error;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;

  const equipment = await rentalService.listEquipment({
    status: status as EquipmentStatus | undefined,
    q
  });
  return NextResponse.json({ success: true, data: equipment });
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
    const equipment = await rentalService.createEquipment(parsed.data);
    return NextResponse.json({ success: true, data: equipment }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err instanceof Error ? err.message : "Erro ao cadastrar equipamento." }, { status: 500 });
  }
}
