import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { requireApiUser } from "@/server/auth/api-guard";

const batchPaymentSchema = z.object({
  paymentMethod: z.string().trim().min(1, "Forma de pagamento obrigatória").max(100),
  paymentDate: z.string().min(1, "Data do pagamento obrigatória"),
  paymentReference: z.string().trim().max(200).optional().or(z.literal("")),
  fiscalDocumentId: z.string().trim().optional().or(z.literal("")),
  items: z
    .array(
      z.discriminatedUnion("kind", [
        z.object({
          kind: z.literal("sale"),
          id: z.string().min(1)
        }),
        z.object({
          kind: z.literal("ticket-billing"),
          ticketId: z.string().min(1)
        }),
        z.object({
          kind: z.literal("monthly-billing"),
          id: z.string().min(1)
        }),
        z.object({
          kind: z.literal("rental-billing"),
          id: z.string().min(1)
        })
      ])
    )
    .min(1, "Selecione ao menos um item.")
});

const terminalTicketStatuses = ["CLOSED", "CANCELED"];

type FiscalLinkInput =
  | { kind: "sale"; saleId: string; label: string; clientId: string }
  | { kind: "ticket"; ticketId: string; label: string; clientId: string }
  | { kind: "monthly-billing"; monthlyBillingId: string; label: string; clientId: string }
  | { kind: "rental-billing"; rentalBillingId: string; label: string; clientId: string };

function dedupeItems(items: z.infer<typeof batchPaymentSchema>["items"]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.kind === "ticket-billing" ? `${item.kind}:${item.ticketId}` : `${item.kind}:${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function POST(request: Request) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
    if ("error" in guard) return guard.error;

    const body = await request.json();
    const result = batchPaymentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Dados inválidos para pagamento em lote.", errors: result.error.flatten() },
        { status: 400 }
      );
    }

    const paymentDate = new Date(result.data.paymentDate);
    if (Number.isNaN(paymentDate.getTime())) {
      return NextResponse.json(
        { success: false, message: "Data do pagamento inválida." },
        { status: 400 }
      );
    }

    const items = dedupeItems(result.data.items);
    const paymentReference = result.data.paymentReference?.trim() || null;
    const fiscalDocumentId = result.data.fiscalDocumentId?.trim() || null;
    const now = new Date();

    const summary = await prisma.$transaction(async (tx) => {
      const counts = {
        sales: 0,
        ticketBillings: 0,
        monthlyBillings: 0,
        rentalBillings: 0
      };
      const fiscalLinks: FiscalLinkInput[] = [];
      const fiscalDocument = fiscalDocumentId
        ? await tx.fiscalDocument.findUnique({
            where: { id: fiscalDocumentId },
            select: { id: true, clientId: true, number: true }
          })
        : null;

      if (fiscalDocumentId && !fiscalDocument) {
        throw new Error("Documento fiscal selecionado não foi encontrado.");
      }

      for (const item of items) {
        if (item.kind === "sale") {
          const sale = await tx.sale.findUnique({
            where: { id: item.id },
            select: { id: true, number: true, clientId: true, financialStatus: true }
          });

          if (!sale) {
            throw new Error("Uma das vendas selecionadas não foi encontrada.");
          }

          if (sale.financialStatus !== "PENDENTE") {
            throw new Error(`A venda ${sale.number} não está pendente.`);
          }

          await tx.sale.update({
            where: { id: sale.id },
            data: {
              financialStatus: "PAGO",
              paymentMethod: result.data.paymentMethod,
              paymentDate,
              paymentReference,
              paidAt: now,
              canceledAt: null,
              cancellationReason: null
            }
          });

          fiscalLinks.push({
            kind: "sale",
            saleId: sale.id,
            label: `Venda ${sale.number}`,
            clientId: sale.clientId
          });

          counts.sales += 1;
          continue;
        }

        if (item.kind === "ticket-billing") {
          const billing = await tx.ticketBilling.findUnique({
            where: { ticketId: item.ticketId },
            include: {
              ticket: { select: { id: true, number: true, title: true, status: true, clientId: true } }
            }
          });

          if (!billing) {
            throw new Error("Uma das cobranças de chamado selecionadas não foi encontrada.");
          }

          if (!terminalTicketStatuses.includes(billing.ticket.status)) {
            throw new Error(`O chamado ${billing.ticket.number} ainda não foi concluído tecnicamente.`);
          }

          if (billing.financialStatus === "PAGO") {
            throw new Error(`O chamado ${billing.ticket.number} já está pago.`);
          }

          if (billing.financialStatus === "CANCELADO") {
            throw new Error(`O financeiro do chamado ${billing.ticket.number} está cancelado.`);
          }

          await tx.ticketBilling.update({
            where: { id: billing.id },
            data: {
              financialStatus: "PAGO",
              paymentMethod: result.data.paymentMethod,
              paymentDate,
              paymentReference,
              approvedAt: billing.approvedAt ?? now,
              invoicedAt: billing.invoicedAt ?? now,
              paidAt: now,
              cancellationReason: null
            }
          });

          await tx.billingHistory.create({
            data: {
              ticketBillingId: billing.id,
              authorId: guard.user.id,
              eventType: "STATUS_UPDATED",
              message: [
                "Pagamento confirmado em lote.",
                fiscalDocument ? `Documento: ${fiscalDocument.number}.` : null,
                `Data: ${paymentDate.toLocaleDateString("pt-BR")}.`,
                `Forma: ${result.data.paymentMethod}.`,
                paymentReference ? `Ref.: ${paymentReference}.` : null
              ]
                .filter(Boolean)
                .join(" ")
            }
          });

          fiscalLinks.push({
            kind: "ticket",
            ticketId: billing.ticket.id,
            label: `Chamado ${billing.ticket.number} · ${billing.ticket.title}`,
            clientId: billing.ticket.clientId
          });

          counts.ticketBillings += 1;
          continue;
        }

        if (item.kind === "monthly-billing") {
          const monthlyBilling = await tx.contractMonthlyBilling.findUnique({
            where: { id: item.id },
            include: { contract: { select: { contractNumber: true } } }
          });

          if (!monthlyBilling) {
            throw new Error("Uma das mensalidades selecionadas não foi encontrada.");
          }

          if (monthlyBilling.financialStatus === "PAGO") {
            throw new Error(`A mensalidade do contrato ${monthlyBilling.contract.contractNumber} já está paga.`);
          }

          if (monthlyBilling.financialStatus === "CANCELADO") {
            throw new Error(`A mensalidade do contrato ${monthlyBilling.contract.contractNumber} está cancelada.`);
          }

          await tx.contractMonthlyBilling.update({
            where: { id: monthlyBilling.id },
            data: {
              financialStatus: "PAGO",
              paidAt: paymentDate,
              paymentMethod: result.data.paymentMethod
            }
          });

          fiscalLinks.push({
            kind: "monthly-billing",
            monthlyBillingId: monthlyBilling.id,
            label: `Mensalidade ${String(monthlyBilling.referenceMonth).padStart(2, "0")}/${monthlyBilling.referenceYear} · contrato ${monthlyBilling.contract.contractNumber}`,
            clientId: monthlyBilling.clientId
          });

          counts.monthlyBillings += 1;
          continue;
        }

        if (guard.user.role !== "ADMIN") {
          throw new Error("Somente administradores podem baixar cobranças de locação.");
        }

        const rentalBilling = await tx.rentalBilling.findUnique({
          where: { id: item.id },
          include: { rentalContract: { select: { contractNumber: true } } }
        });

        if (!rentalBilling) {
          throw new Error("Uma das cobranças de locação selecionadas não foi encontrada.");
        }

        if (rentalBilling.financialStatus === "PAGO") {
          throw new Error(`A cobrança de locação do contrato ${rentalBilling.rentalContract.contractNumber} já está paga.`);
        }

        if (rentalBilling.financialStatus === "CANCELADO") {
          throw new Error(`A cobrança de locação do contrato ${rentalBilling.rentalContract.contractNumber} está cancelada.`);
        }

        await tx.rentalBilling.update({
          where: { id: rentalBilling.id },
          data: {
            financialStatus: "PAGO",
            paymentMethod: result.data.paymentMethod,
            paymentDate,
            paymentReference,
            paidAt: now,
            canceledAt: null
          }
        });

        fiscalLinks.push({
          kind: "rental-billing",
          rentalBillingId: rentalBilling.id,
          label: `Locação ${String(rentalBilling.referenceMonth).padStart(2, "0")}/${rentalBilling.referenceYear} · contrato ${rentalBilling.rentalContract.contractNumber}`,
          clientId: rentalBilling.clientId
        });

        counts.rentalBillings += 1;
      }

      if (fiscalDocument) {
        const invalidClient = fiscalLinks.find((link) => link.clientId !== fiscalDocument.clientId);
        if (invalidClient) {
          throw new Error("O documento fiscal selecionado pertence a outro cliente.");
        }

        for (const link of fiscalLinks) {
          const existingLink = await tx.fiscalDocumentLink.findFirst({
            where:
              link.kind === "sale"
                ? { fiscalDocumentId: fiscalDocument.id, saleId: link.saleId }
                : link.kind === "ticket"
                  ? { fiscalDocumentId: fiscalDocument.id, ticketId: link.ticketId }
                  : link.kind === "monthly-billing"
                    ? { fiscalDocumentId: fiscalDocument.id, monthlyBillingId: link.monthlyBillingId }
                    : { fiscalDocumentId: fiscalDocument.id, rentalBillingId: link.rentalBillingId },
            select: { id: true }
          });

          if (!existingLink) {
            await tx.fiscalDocumentLink.create({
              data:
                link.kind === "sale"
                  ? {
                      fiscalDocumentId: fiscalDocument.id,
                      saleId: link.saleId,
                      label: link.label
                    }
                  : link.kind === "ticket"
                    ? {
                        fiscalDocumentId: fiscalDocument.id,
                        ticketId: link.ticketId,
                        label: link.label
                      }
                    : link.kind === "monthly-billing"
                      ? {
                          fiscalDocumentId: fiscalDocument.id,
                          monthlyBillingId: link.monthlyBillingId,
                          label: link.label
                        }
                      : {
                          fiscalDocumentId: fiscalDocument.id,
                          rentalBillingId: link.rentalBillingId,
                          label: link.label
                        }
            });
          }
        }
      }

      return counts;
    });

    return NextResponse.json({
      success: true,
      data: {
        ...summary,
        total: summary.sales + summary.ticketBillings + summary.monthlyBillings + summary.rentalBillings
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao registrar pagamentos em lote." },
      { status: 500 }
    );
  }
}
