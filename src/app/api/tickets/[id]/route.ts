import { NextResponse } from "next/server";

import { ticketCommentSchema, ticketUpdateSchema } from "@/lib/validations/ticket-actions";
import { canEditTicketAssignment, canEditTicketPriority } from "@/server/auth/permissions";
import { requireApiUser } from "@/server/auth/api-guard";
import { ticketService } from "@/server/services/ticket-service";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiUser();

  if ("error" in guard) {
    return guard.error;
  }

  const { id } = await context.params;
  const ticket = await ticketService.getTicket(id);

  if (!ticket) {
    return NextResponse.json(
      {
        success: false,
        message: "Chamado nao encontrado."
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: ticket
  });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT", "TECHNICIAN"]);

    if ("error" in guard) {
      return guard.error;
    }

    const { id } = await context.params;
    const body = await request.json();
    const result = ticketUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Dados invalidos para atualizar o chamado.",
          errors: result.error.flatten()
        },
        { status: 400 }
      );
    }

    if (!canEditTicketPriority(guard.user.role) || !canEditTicketAssignment(guard.user.role)) {
      const current = await ticketService.getTicket(id);

      if (!current) {
        return NextResponse.json(
          {
            success: false,
            message: "Chamado nao encontrado."
          },
          { status: 404 }
        );
      }

      const changedPriority = result.data.priority !== current.priority;
      const changedAssignee = (result.data.assigneeId || "") !== (current.assigneeId || "");

      if (changedPriority || changedAssignee) {
        return NextResponse.json(
          {
            success: false,
            message: "Seu perfil nao pode alterar prioridade ou responsavel."
          },
          { status: 403 }
        );
      }
    }

    const ticket = await ticketService.updateTicketFields(
      id,
      {
        ...result.data,
        assigneeId: result.data.assigneeId || undefined,
        closingReason: result.data.closingReason || undefined
      },
      guard.user.id
    );

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          message: "Chamado nao encontrado."
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Falha ao atualizar chamado."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT", "TECHNICIAN"]);

    if ("error" in guard) {
      return guard.error;
    }

    const { id } = await context.params;
    const body = await request.json();
    const result = ticketCommentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Dados invalidos para comentar no chamado.",
          errors: result.error.flatten()
        },
        { status: 400 }
      );
    }

    const ticket = await ticketService.addComment(id, result.data.message, guard.user.id);

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          message: "Chamado nao encontrado."
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Falha ao comentar no chamado."
      },
      { status: 500 }
    );
  }
}
