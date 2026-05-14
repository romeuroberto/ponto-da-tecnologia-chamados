import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/server/auth/api-guard";
import { ticketCategoryService } from "@/server/services/ticket-category-service";

const categoryUpdateSchema = z.object({
  label: z.string().min(1, "Label obrigatório"),
  suggestedRole: z.enum(["ATTENDANT", "TECHNICIAN"]).nullable().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional()
});

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN"]);
    if ("error" in guard) return guard.error;

    const { id } = await context.params;
    const body = await request.json();
    const result = categoryUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ success: false, message: "Dados inválidos.", errors: result.error.flatten() }, { status: 400 });
    }

    const data = await ticketCategoryService.updateCategory(id, result.data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Falha ao atualizar categoria." }, { status: 500 });
  }
}
