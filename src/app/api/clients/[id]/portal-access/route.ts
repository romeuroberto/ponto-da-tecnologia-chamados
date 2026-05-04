import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/server/auth/api-guard";
import { clientService } from "@/server/services/client-service";
import { userService } from "@/server/services/user-service";

const createPortalAccessSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
  if ("error" in guard) return guard.error;

  const { id: clientId } = await params;

  const client = await clientService.getClient(clientId);
  if (!client) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const existing = await userService.getPortalUserByClientId(clientId);
  if (existing) {
    return NextResponse.json({ error: "Este cliente já possui acesso ao portal" }, { status: 409 });
  }

  const body = await req.json();
  const parsed = createPortalAccessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.issues }, { status: 400 });
  }

  const user = await userService.createClientAccess(clientId, parsed.data.name, parsed.data.email, parsed.data.password);
  return NextResponse.json(user, { status: 201 });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
  if ("error" in guard) return guard.error;

  const { id: clientId } = await params;
  const user = await userService.getPortalUserByClientId(clientId);
  return NextResponse.json(user ?? null);
}
