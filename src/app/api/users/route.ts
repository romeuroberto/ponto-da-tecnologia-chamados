import { NextResponse } from "next/server";

import { userSchema } from "@/lib/validations/user";
import { requireApiUser } from "@/server/auth/api-guard";
import { userService } from "@/server/services/user-service";

export async function GET(request: Request) {
  const guard = await requireApiUser(["ADMIN"]);

  if ("error" in guard) {
    return guard.error;
  }

  const { searchParams } = new URL(request.url);

  return NextResponse.json({
    success: true,
    data: await userService.searchUsers({
      query: searchParams.get("q") ?? undefined,
      role: (searchParams.get("role") as Parameters<typeof userService.searchUsers>[0]["role"]) ?? undefined,
      sort: (searchParams.get("sort") as Parameters<typeof userService.searchUsers>[0]["sort"]) ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined
    })
  });
}

export async function POST(request: Request) {
  try {
    const guard = await requireApiUser(["ADMIN"]);

    if ("error" in guard) {
      return guard.error;
    }

    const body = await request.json();
    const result = userSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Dados invalidos para criar o usuario.",
          errors: result.error.flatten()
        },
        { status: 400 }
      );
    }

    const data = await userService.createUser(result.data);

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
        message: error instanceof Error ? error.message : "Falha ao criar usuario."
      },
      { status: 500 }
    );
  }
}
