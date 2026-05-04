import { NextResponse } from "next/server";

import { areBillingEntriesLocked } from "@/lib/billing-rules";
import { billingEntrySchema } from "@/lib/validations/billing";
import { requireApiUser } from "@/server/auth/api-guard";
import { canManageTicketBilling } from "@/server/auth/permissions";
import { billingService } from "@/server/services/billing-service";

export async function PUT(request: Request, context: { params: Promise<{ id: string; entryId: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);

    if ("error" in guard) {
      return guard.error;
    }

    if (!canManageTicketBilling(guard.user.role)) {
      return NextResponse.json(
        { success: false, message: "Seu perfil não pode editar dados financeiros." },
        { status: 403 }
      );
    }

    const { id, entryId } = await context.params;

    const current = await billingService.getTicketBilling(id);
    if (current && areBillingEntriesLocked(current.financialStatus)) {
      return NextResponse.json(
        { success: false, message: "Não é possível editar lançamentos após a aprovação do financeiro." },
        { status: 422 }
      );
    }

    const body = await request.json();
    const result = billingEntrySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Dados inválidos para o lançamento financeiro.", errors: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = await billingService.updateBillingEntry(
      id,
      entryId,
      {
        entryType: result.data.entryType,
        description: result.data.description,
        quantity: result.data.quantity,
        unitPrice: result.data.unitPrice,
        billable: result.data.billable
      },
      guard.user.id
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao atualizar lançamento financeiro." },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string; entryId: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);

    if ("error" in guard) {
      return guard.error;
    }

    if (!canManageTicketBilling(guard.user.role)) {
      return NextResponse.json(
        { success: false, message: "Seu perfil não pode editar dados financeiros." },
        { status: 403 }
      );
    }

    const { id, entryId } = await context.params;

    const current = await billingService.getTicketBilling(id);
    if (current && areBillingEntriesLocked(current.financialStatus)) {
      return NextResponse.json(
        { success: false, message: "Não é possível remover lançamentos após a aprovação do financeiro." },
        { status: 422 }
      );
    }

    const data = await billingService.deleteBillingEntry(id, entryId, guard.user.id);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao remover lançamento financeiro." },
      { status: 500 }
    );
  }
}
