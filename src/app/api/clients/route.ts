import { NextResponse } from "next/server";

import { clientSchema } from "@/lib/validations/client";
import { requireApiUser } from "@/server/auth/api-guard";
import { clientService } from "@/server/services/client-service";

export async function GET(request: Request) {
  const guard = await requireApiUser();

  if ("error" in guard) {
    return guard.error;
  }

  const { searchParams } = new URL(request.url);

  return NextResponse.json({
    success: true,
    data: await clientService.searchClients({
      query: searchParams.get("q") ?? undefined,
      sort: (searchParams.get("sort") as Parameters<typeof clientService.searchClients>[0]["sort"]) ?? undefined,
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
    const result = clientSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Dados invalidos para criar o cliente.",
          errors: result.error.flatten()
        },
        { status: 400 }
      );
    }

    const data = await clientService.createClient(result.data);

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
        message: error instanceof Error ? error.message : "Falha ao criar cliente."
      },
      { status: 500 }
    );
  }
}
