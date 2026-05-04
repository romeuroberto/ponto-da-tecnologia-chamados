import { NextResponse } from "next/server";

import { serviceOrderUpdateSchema } from "@/lib/validations/service-order";
import { requireApiUser } from "@/server/auth/api-guard";
import { canOperateOnTicket } from "@/server/auth/permissions";
import { serviceOrderService } from "@/server/services/service-order-service";
import { ticketService } from "@/server/services/ticket-service";

export async function GET(_: Request, context: { params: Promise<{ id: string; serviceOrderId: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT", "TECHNICIAN"]);

    if ("error" in guard) {
      return guard.error;
    }

    const { id, serviceOrderId } = await context.params;
    const ticket = await ticketService.getTicket(id);

    if (!ticket) {
      return NextResponse.json({ success: false, message: "Chamado não encontrado." }, { status: 404 });
    }

    const data = await serviceOrderService.getTicketServiceOrder(id, serviceOrderId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao carregar ordem de serviço." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string; serviceOrderId: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);

    if ("error" in guard) {
      return guard.error;
    }

    const { id, serviceOrderId } = await context.params;
    const ticket = await ticketService.getTicket(id);

    if (!ticket) {
      return NextResponse.json({ success: false, message: "Chamado não encontrado." }, { status: 404 });
    }

    if (!canOperateOnTicket(guard.user.role, guard.user.id, ticket.assigneeId)) {
      return NextResponse.json({ success: false, message: "Seu perfil só pode operar chamados sem responsável ou atribuídos a você." }, { status: 403 });
    }

    const body = await request.json();
    const result = serviceOrderUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Dados inválidos para atualizar ordem de serviço.", errors: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = await serviceOrderService.updateTicketServiceOrder(
      id,
      serviceOrderId,
      {
        status: result.data.status,
        serviceType: result.data.serviceType || undefined,
        assignedTechnicianId: result.data.assignedTechnicianId || undefined,
        scheduledStartAt: result.data.scheduledStartAt || undefined,
        startedAt: result.data.startedAt || undefined,
        finishedAt: result.data.finishedAt || undefined,
        executionNotes: result.data.executionNotes || undefined,
        customerApprovalName: result.data.customerApprovalName || undefined,
        customerApprovalAt: result.data.customerApprovalAt || undefined,
        parts: result.data.parts?.map((part) => ({
          partCatalogItemId: part.partCatalogItemId,
          quantity: part.quantity,
          unitPrice: part.unitPrice,
          notes: part.notes || undefined
        }))
      },
      guard.user.id
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao atualizar ordem de serviço." },
      { status: 500 }
    );
  }
}
