import { NextResponse } from "next/server";

import { billingEntrySchema } from "@/lib/validations/billing";
import { requireApiUser } from "@/server/auth/api-guard";
import { canManageTicketBilling } from "@/server/auth/permissions";
import { billingService } from "@/server/services/billing-service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);

    if ("error" in guard) {
      return guard.error;
    }

    if (!canManageTicketBilling(guard.user.role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Seu perfil não pode editar dados financeiros."
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = billingEntrySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Dados invalidos para o lancamento financeiro.",
          errors: result.error.flatten()
        },
        { status: 400 }
      );
    }

    const { id } = await context.params;
    const data = await billingService.addBillingEntry(
      id,
      {
        entryType: result.data.entryType,
        description: result.data.description,
        quantity: result.data.quantity,
        unitPrice: result.data.unitPrice,
        billable: result.data.billable
      },
      guard.user.id
    );

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
        message: error instanceof Error ? error.message : "Falha ao criar lancamento financeiro."
      },
      { status: 500 }
    );
  }
}
