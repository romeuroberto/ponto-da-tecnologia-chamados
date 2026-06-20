import { NextResponse } from "next/server";

import { isBillingSummaryLocked } from "@/lib/billing-rules";
import { billingSummarySchema } from "@/lib/validations/billing";
import { requireApiUser } from "@/server/auth/api-guard";
import { canManageTicketBilling, canViewFinancialModule } from "@/server/auth/permissions";
import { billingService } from "@/server/services/billing-service";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT", "TECHNICIAN"]);

    if ("error" in guard) {
      return guard.error;
    }

    if (!canViewFinancialModule(guard.user.role)) {
      return NextResponse.json(
        { success: false, message: "Seu perfil não pode visualizar dados financeiros." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const data = await billingService.getTicketBilling(id);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao carregar financeiro do chamado." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
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

    const { id } = await context.params;
    const body = await request.json();
    const result = billingSummarySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Dados inválidos para o resumo financeiro.", errors: result.error.flatten() },
        { status: 400 }
      );
    }

    const current = await billingService.getTicketBilling(id);
    const nextStatus = result.data.financialStatus;

    if (current?.financialStatus === "PAGO" && nextStatus !== "PENDENTE") {
      return NextResponse.json(
        { success: false, message: "Este financeiro está encerrado e não pode ser alterado." },
        { status: 422 }
      );
    }

    if (current && isBillingSummaryLocked(current.financialStatus) && current.financialStatus === nextStatus) {
      return NextResponse.json(
        { success: false, message: "Os valores deste financeiro estão bloqueados no status atual." },
        { status: 422 }
      );
    }

    const data = await billingService.saveTicketBilling(
      id,
      {
        billingType: result.data.billingType,
        financialStatus: result.data.financialStatus,
        discountAmount: result.data.discountAmount,
        internalNotes: result.data.internalNotes || undefined,
        invoiceNumber: result.data.invoiceNumber || undefined,
        invoiceDueDate: result.data.invoiceDueDate || undefined,
        paymentMethod: result.data.paymentMethod || undefined,
        paymentDate: result.data.paymentDate || undefined,
        paymentReference: result.data.paymentReference || undefined,
        cancellationReason: result.data.cancellationReason || undefined
      },
      guard.user.id
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao salvar resumo financeiro." },
      { status: 500 }
    );
  }
}
