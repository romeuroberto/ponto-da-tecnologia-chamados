import { NextResponse } from "next/server";

import { requireApiUser } from "@/server/auth/api-guard";
import { ticketService } from "@/server/services/ticket-service";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiUser(["TECHNICIAN"]);

    if ("error" in guard) {
      return guard.error;
    }

    const { id } = await context.params;
    const ticket = await ticketService.claimTicket(id, guard.user.id);

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          message: "Este chamado já foi assumido por outro responsável ou não está mais disponível."
        },
        { status: 409 }
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
        message: error instanceof Error ? error.message : "Falha ao assumir chamado."
      },
      { status: 500 }
    );
  }
}
