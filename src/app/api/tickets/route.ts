import { NextResponse } from "next/server";

import { ticketSchema } from "@/lib/validations/ticket";
import { requireApiUser } from "@/server/auth/api-guard";
import { ticketService } from "@/server/services/ticket-service";

export async function GET(request: Request) {
  const guard = await requireApiUser();

  if ("error" in guard) {
    return guard.error;
  }

  const { searchParams } = new URL(request.url);

  return NextResponse.json({
    success: true,
    data: await ticketService.searchTickets({
      query: searchParams.get("q") ?? undefined,
      status: (searchParams.get("status") as Parameters<typeof ticketService.searchTickets>[0]["status"]) ?? undefined,
      priority: (searchParams.get("priority") as Parameters<typeof ticketService.searchTickets>[0]["priority"]) ?? undefined,
      client: searchParams.get("client") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      sort: (searchParams.get("sort") as Parameters<typeof ticketService.searchTickets>[0]["sort"]) ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined
    })
  });
}

export async function POST(request: Request) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);

    if ("error" in guard) {
      return guard.error;
    }

    const body = await request.json();
    const result = ticketSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Dados invalidos para criar o chamado.",
          errors: result.error.flatten()
        },
        { status: 400 }
      );
    }

    const data = await ticketService.createTicket(result.data, guard.user.id);

    return NextResponse.json(
      {
        success: true,
        data
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Falha ao criar chamado."
      },
      { status: 500 }
    );
  }
}
