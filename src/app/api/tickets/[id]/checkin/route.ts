import { NextResponse } from "next/server";

import { requireApiUser } from "@/server/auth/api-guard";
import { canOperateOnTicket } from "@/server/auth/permissions";
import { ticketService } from "@/server/services/ticket-service";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT", "TECHNICIAN"]);

    if ("error" in guard) {
      return guard.error;
    }

    const { id } = await context.params;
    const current = await ticketService.getTicket(id);

    if (!current) {
      return NextResponse.json({ success: false, message: "Chamado não encontrado." }, { status: 404 });
    }

    if (!canOperateOnTicket(guard.user.role, guard.user.id, current.assigneeId)) {
      return NextResponse.json(
        { success: false, message: "Seu perfil só pode registrar check-in em chamados atribuídos a você." },
        { status: 403 }
      );
    }

    if (current.status === "CLOSED" || current.status === "CANCELED") {
      return NextResponse.json(
        { success: false, message: "Não é possível registrar check-in em chamados encerrados ou cancelados." },
        { status: 409 }
      );
    }

    const ticket = await ticketService.checkIn(id, guard.user.id);

    return NextResponse.json({ success: true, data: ticket });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao registrar check-in." },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT", "TECHNICIAN"]);

    if ("error" in guard) {
      return guard.error;
    }

    const { id } = await context.params;
    const current = await ticketService.getTicket(id);

    if (!current) {
      return NextResponse.json({ success: false, message: "Chamado não encontrado." }, { status: 404 });
    }

    if (!canOperateOnTicket(guard.user.role, guard.user.id, current.assigneeId)) {
      return NextResponse.json(
        { success: false, message: "Seu perfil só pode registrar check-out em chamados atribuídos a você." },
        { status: 403 }
      );
    }

    if (current.status === "CLOSED" || current.status === "CANCELED") {
      return NextResponse.json(
        { success: false, message: "Não é possível registrar check-out em chamados encerrados ou cancelados." },
        { status: 409 }
      );
    }

    const ticket = await ticketService.checkOut(id, guard.user.id);

    return NextResponse.json({ success: true, data: ticket });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao registrar check-out." },
      { status: 500 }
    );
  }
}
