import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { BillingEntryType, BillingType, FinancialStatus, TicketBilling } from "@/types";
import { normalizeOptionalString } from "@/server/db-support";
import { mapTicketBilling, ticketBillingInclude } from "@/server/mappers";

export interface UpsertTicketBillingInput {
  billingType: BillingType;
  financialStatus: FinancialStatus;
  discountAmount: number;
  internalNotes?: string;
  authorId: string;
}

export interface CreateBillingEntryInput {
  entryType: BillingEntryType;
  description: string;
  quantity: number;
  unitPrice: number;
  billable: boolean;
  createdById: string;
}

export interface UpdateBillingEntryInput {
  entryType: BillingEntryType;
  description: string;
  quantity: number;
  unitPrice: number;
  billable: boolean;
  authorId: string;
}

function toMoney(value: number) {
  return Number(value.toFixed(2));
}

function buildFinancialTimestamps(status: FinancialStatus, current?: { approvedAt?: Date | null; invoicedAt?: Date | null; paidAt?: Date | null }) {
  return {
    approvedAt: status === "APROVADO" || status === "FATURADO" || status === "PAGO" ? current?.approvedAt ?? new Date() : null,
    invoicedAt: status === "FATURADO" || status === "PAGO" ? current?.invoicedAt ?? new Date() : null,
    paidAt: status === "PAGO" ? current?.paidAt ?? new Date() : null
  };
}

function getEntryTypeLabel(type: BillingEntryType) {
  const labels: Record<BillingEntryType, string> = {
    LABOR: "Horas",
    PART: "Peça",
    TRAVEL: "Deslocamento",
    EXTRA: "Extra"
  };

  return labels[type];
}

async function recalculateTotals(tx: Prisma.TransactionClient, billingId: string) {
  const billing = await tx.ticketBilling.findUnique({
    where: { id: billingId },
    include: ticketBillingInclude
  });

  if (!billing) {
    return null;
  }

  const subtotalAmount = toMoney(
    billing.entries.filter((entry) => entry.billable).reduce((sum, entry) => sum + Number(entry.totalPrice), 0)
  );
  const discountAmount = toMoney(Number(billing.discountAmount));
  const totalAmount = Math.max(0, toMoney(subtotalAmount - discountAmount));

  const updated = await tx.ticketBilling.update({
    where: { id: billingId },
    data: {
      subtotalAmount,
      totalAmount
    },
    include: ticketBillingInclude
  });

  return mapTicketBilling(updated);
}

export const billingRepository = {
  async findByTicketId(ticketId: string): Promise<TicketBilling | null> {
    const record = await prisma.ticketBilling.findUnique({
      where: { ticketId },
      include: ticketBillingInclude
    });

    return record ? mapTicketBilling(record) : null;
  },

  async upsertByTicketId(ticketId: string, input: UpsertTicketBillingInput) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.ticketBilling.findUnique({
        where: { ticketId },
        select: {
          id: true,
          financialStatus: true,
          approvedAt: true,
          invoicedAt: true,
          paidAt: true
        }
      });

      const timestamps = buildFinancialTimestamps(input.financialStatus, current ?? undefined);

      const record = await tx.ticketBilling.upsert({
        where: { ticketId },
        create: {
          ticketId,
          billingType: input.billingType,
          financialStatus: input.financialStatus,
          discountAmount: toMoney(input.discountAmount),
          internalNotes: normalizeOptionalString(input.internalNotes),
          ...timestamps
        },
        update: {
          billingType: input.billingType,
          financialStatus: input.financialStatus,
          discountAmount: toMoney(input.discountAmount),
          internalNotes: normalizeOptionalString(input.internalNotes),
          ...timestamps
        },
        include: ticketBillingInclude
      });

      await tx.billingHistory.create({
        data: {
          ticketBillingId: record.id,
          authorId: input.authorId,
          eventType:
            !current || current.financialStatus !== input.financialStatus
              ? "STATUS_UPDATED"
              : "SUMMARY_UPDATED",
          message:
            !current
              ? `Resumo financeiro criado com tipo ${input.billingType} e status ${input.financialStatus}.`
              : `Resumo financeiro atualizado. Tipo ${input.billingType}, status ${input.financialStatus}, desconto ${toMoney(input.discountAmount)}.`
        }
      });

      return recalculateTotals(tx, record.id);
    });
  },

  async addEntry(ticketId: string, input: CreateBillingEntryInput) {
    return prisma.$transaction(async (tx) => {
      const billing = await tx.ticketBilling.upsert({
        where: { ticketId },
        create: {
          ticketId
        },
        update: {},
        select: {
          id: true
        }
      });

      await tx.billingEntry.create({
        data: {
          ticketBillingId: billing.id,
          entryType: input.entryType,
          description: input.description,
          quantity: input.quantity,
          unitPrice: toMoney(input.unitPrice),
          totalPrice: toMoney(input.quantity * input.unitPrice),
          billable: input.billable,
          createdById: input.createdById
        }
      });

      await tx.billingHistory.create({
        data: {
          ticketBillingId: billing.id,
          authorId: input.createdById,
          eventType: "ENTRY_CREATED",
          message: `Lancamento criado: ${getEntryTypeLabel(input.entryType)} - ${input.description}.`
        }
      });

      return recalculateTotals(tx, billing.id);
    });
  },

  async updateEntry(ticketId: string, entryId: string, input: UpdateBillingEntryInput) {
    return prisma.$transaction(async (tx) => {
      const billing = await tx.ticketBilling.findUnique({
        where: { ticketId },
        select: { id: true }
      });

      if (!billing) {
        return null;
      }

      const existingEntry = await tx.billingEntry.findFirst({
        where: {
          id: entryId,
          ticketBillingId: billing.id
        },
        select: { id: true }
      });

      if (!existingEntry) {
        return null;
      }

      await tx.billingEntry.update({
        where: { id: entryId },
        data: {
          entryType: input.entryType,
          description: input.description,
          quantity: input.quantity,
          unitPrice: toMoney(input.unitPrice),
          totalPrice: toMoney(input.quantity * input.unitPrice),
          billable: input.billable
        }
      });

      await tx.billingHistory.create({
        data: {
          ticketBillingId: billing.id,
          authorId: input.authorId,
          eventType: "ENTRY_UPDATED",
          message: `Lancamento atualizado: ${getEntryTypeLabel(input.entryType)} - ${input.description}.`
        }
      });

      return recalculateTotals(tx, billing.id);
    });
  },

  async deleteEntry(ticketId: string, entryId: string, authorId: string) {
    return prisma.$transaction(async (tx) => {
      const billing = await tx.ticketBilling.findUnique({
        where: { ticketId },
        select: { id: true }
      });

      if (!billing) {
        return null;
      }

      const existingEntry = await tx.billingEntry.findFirst({
        where: {
          id: entryId,
          ticketBillingId: billing.id
        },
        select: { id: true, entryType: true, description: true }
      });

      if (!existingEntry) {
        return null;
      }

      await tx.billingEntry.delete({
        where: { id: entryId }
      });

      await tx.billingHistory.create({
        data: {
          ticketBillingId: billing.id,
          authorId,
          eventType: "ENTRY_DELETED",
          message: `Lancamento removido: ${getEntryTypeLabel(existingEntry.entryType)} - ${existingEntry.description}.`
        }
      });

      return recalculateTotals(tx, billing.id);
    });
  }
};
