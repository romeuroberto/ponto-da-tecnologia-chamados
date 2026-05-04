import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/server/auth/api-guard";
import { ticketService } from "@/server/services/ticket-service";

const commentSchema = z.object({
  message: z.string().min(1)
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiUser(["CLIENT"]);
  if ("error" in guard) return guard.error;

  const user = guard.user;
  if (!user.clientId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;
  const ticket = await ticketService.getTicket(id);

  if (!ticket || ticket.clientId !== user.clientId) {
    return NextResponse.json({ error: "Chamado não encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  await ticketService.addComment(id, parsed.data.message, user.id);
  return NextResponse.json({ ok: true });
}
