import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/server/auth/api-guard";
import { ticketCategoryService } from "@/server/services/ticket-category-service";

const categorySchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  label: z.string().min(1, "Label obrigatório"),
  suggestedRole: z.enum(["ATTENDANT", "TECHNICIAN"]).nullable().optional(),
  sortOrder: z.number().int().min(0).optional()
});

export async function GET(request: Request) {
  const guard = await requireApiUser();
  if ("error" in guard) return guard.error;

  const { searchParams } = new URL(request.url);
  const onlyActive = searchParams.get("active") === "true";

  return NextResponse.json({ success: true, data: await ticketCategoryService.listCategories(onlyActive) });
}

export async function POST(request: Request) {
  try {
    const guard = await requireApiUser(["ADMIN"]);
    if ("error" in guard) return guard.error;

    const body = await request.json();
    const result = categorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ success: false, message: "Dados inválidos.", errors: result.error.flatten() }, { status: 400 });
    }

    const data = await ticketCategoryService.createCategory(result.data);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Falha ao criar categoria." }, { status: 500 });
  }
}
