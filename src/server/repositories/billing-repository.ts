import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { BillingEntryType, BillingType, FinancialStatus, OsContribution, TicketBilling } from "@/types";
import { isDatabaseConfigured, normalizeOptionalString } from "@/server/db-support";
import { mapTicketBilling, ticketBillingInclude } from "@/server/mappers";
import { contractRepository } from "@/server/repositories/contract-repository";

interface RawOsRecord {
  id: string;
  number: string;
  servicePrice: { toNumber(): number } | null;
  parts: Array<{ unitPrice: { toNumber(): number }; quantity: { toNumber(): number } }>;
}

function buildOsContributions(orders: RawOsRecord[]): OsContribution[] {
  return orders.map((os) => {
    const laborAmount = toMoney(os.servicePrice ? os.servicePrice.toNumber() : 0);
    const partsAmount = toMoney(
      (os.parts ?? []).reduce((s, p) => s + p.unitPrice.toNumber() * p.quantity.toNumber(), 0)
    );
    return {
      osId: os.id,
      osNumber: os.number,
      laborAmount,
      partsAmount,
      totalAmount: toMoney(laborAmount + partsAmount)
    };
  });
}

export interface UpsertTicketBillingInput {
  billingType: BillingType;
  financialStatus: FinancialStatus;
  discountAmount: number;
  internalNotes?: string;
  invoiceNumber?: string;
  invoiceDueDate?: string;
  paymentMethod?: string;
  paymentDate?: string;
  paymentReference?: string;
  cancellationReason?: string;
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

function toOptionalDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function buildFinancialTimestamps(
  status: FinancialStatus,
  current?: { approvedAt?: Date | null; invoicedAt?: Date | null; paidAt?: Date | null }
) {
  return {
    approvedAt: ["APROVADO", "FATURADO", "PAGO"].includes(status) ? (current?.approvedAt ?? new Date()) : null,
    invoicedAt: ["FATURADO", "PAGO"].includes(status) ? (current?.invoicedAt ?? new Date()) : null,
    paidAt: status === "PAGO" ? (current?.paidAt ?? new Date()) : null
  };
}

function getEntryTypeLabel(type: BillingEntryType) {
  const labels: Record<BillingEntryType, string> = {
    LABOR: "Mão de obra",
    PART: "Material / Peça",
    TRAVEL: "Deslocamento",
    EXTRA: "Cobrança avulsa",
    CONSULTING: "Consultoria / Análise",
    REMOTE_SUPPORT: "Suporte Remoto"
  };
  return labels[type];
}

function buildTransitionMessage(
  previousStatus: FinancialStatus | null,
  input: UpsertTicketBillingInput
): string {
  const { financialStatus: next } = input;

  if (!previousStatus) {
    return `Resumo financeiro criado. Tipo: ${input.billingType}. Status: ${next}.`;
  }

  if (previousStatus === next) {
    return `Resumo financeiro atualizado. Tipo: ${input.billingType}, desconto R$ ${toMoney(input.discountAmount).toFixed(2)}.`;
  }

  switch (next) {
    case "EM_ANALISE":
      return "Financeiro submetido para análise.";
    case "APROVADO":
      return "Valores aprovados. Lançamentos bloqueados para edição.";
    case "FATURADO": {
      const parts = ["Faturamento registrado."];
      if (input.invoiceNumber) parts.push(`Cobrança: ${input.invoiceNumber}.`);
      if (input.invoiceDueDate) {
        const due = new Date(input.invoiceDueDate);
        parts.push(`Vencimento: ${due.toLocaleDateString("pt-BR")}.`);
      }
      return parts.join(" ");
    }
    case "PAGO": {
      const parts = ["Pagamento confirmado."];
      if (input.paymentDate) {
        const d = new Date(input.paymentDate);
        parts.push(`Data: ${d.toLocaleDateString("pt-BR")}.`);
      }
      if (input.paymentMethod) parts.push(`Forma: ${input.paymentMethod}.`);
      if (input.paymentReference) parts.push(`Ref.: ${input.paymentReference}.`);
      return parts.join(" ");
    }
    case "CANCELADO":
      return `Financeiro cancelado. Motivo: ${input.cancellationReason || "não informado"}.`;
    case "PENDENTE":
      return "Financeiro reaberto para novo ciclo.";
    default:
      return `Status financeiro atualizado para ${next}.`;
  }
}

async function recalculateTotals(tx: Prisma.TransactionClient, billingId: string) {
  const billing = await tx.ticketBilling.findUnique({
    where: { id: billingId },
    include: ticketBillingInclude
  });

  if (!billing) return null;

  // Camada 1: contribuições das OSs concluídas
  const completedOrders = await tx.serviceOrder.findMany({
    where: { ticketId: billing.ticketId, status: "COMPLETED" },
    include: { parts: true }
  });
  const osContributions = buildOsContributions(completedOrders);
  const osTotal = toMoney(osContributions.reduce((s, c) => s + c.totalAmount, 0));

  // Camada 2: lançamentos avulsos billable
  const subtotalAmount = toMoney(
    billing.entries.filter((e) => e.billable).reduce((sum, e) => sum + Number(e.totalPrice), 0)
  );

  const discountAmount = toMoney(Number(billing.discountAmount));
  const totalAmount = Math.max(0, toMoney(osTotal + subtotalAmount - discountAmount));

  const updated = await tx.ticketBilling.update({
    where: { id: billingId },
    data: { subtotalAmount, totalAmount },
    include: ticketBillingInclude
  });

  return mapTicketBilling(updated, osContributions);
}

export interface BillingListItem {
  id: string;
  ticketId: string;
  ticketNumber: string;
  ticketTitle: string;
  clientName: string;
  billingType: BillingType;
  financialStatus: FinancialStatus;
  totalAmount: number;
  entryCount: number;
  invoiceDueDate?: string;
  updatedAt: string;
}

export const billingRepository = {
  async recalculateForTicket(ticketId: string) {
    return prisma.$transaction(async (tx) => {
      const billing = await tx.ticketBilling.upsert({
        where: { ticketId },
        create: { ticketId },
        update: {},
        select: { id: true }
      });
      return recalculateTotals(tx, billing.id);
    });
  },

  async listAll(input: { financialStatus?: FinancialStatus }): Promise<BillingListItem[]> {
    const records = await prisma.ticketBilling.findMany({
      where: {
        financialStatus: input.financialStatus
      },
      include: {
        ticket: { include: { client: true } },
        _count: { select: { entries: true } }
      },
      orderBy: { updatedAt: "desc" }
    });

    return records.map((r) => ({
      id: r.id,
      ticketId: r.ticketId,
      ticketNumber: r.ticket.number,
      ticketTitle: r.ticket.title,
      clientName: r.ticket.client.name,
      billingType: r.billingType,
      financialStatus: r.financialStatus,
      totalAmount: Number(r.totalAmount),
      entryCount: r._count.entries,
      invoiceDueDate: r.invoiceDueDate?.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    }));
  },

  async listByClient(clientId: string, input: { financialStatus?: FinancialStatus } = {}): Promise<BillingListItem[]> {
    if (!isDatabaseConfigured()) {
      return [];
    }

    const records = await prisma.ticketBilling.findMany({
      where: {
        financialStatus: input.financialStatus,
        ticket: {
          clientId
        }
      },
      include: {
        ticket: { include: { client: true } },
        _count: { select: { entries: true } }
      },
      orderBy: { updatedAt: "desc" }
    });

    return records.map((r) => ({
      id: r.id,
      ticketId: r.ticketId,
      ticketNumber: r.ticket.number,
      ticketTitle: r.ticket.title,
      clientName: r.ticket.client.name,
      billingType: r.billingType,
      financialStatus: r.financialStatus,
      totalAmount: Number(r.totalAmount),
      entryCount: r._count.entries,
      invoiceDueDate: r.invoiceDueDate?.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    }));
  },

  async findByTicketId(ticketId: string): Promise<TicketBilling | null> {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, select: { clientId: true } });
    const [record, completedOrders, activeContract] = await Promise.all([
      prisma.ticketBilling.findUnique({ where: { ticketId }, include: ticketBillingInclude }),
      prisma.serviceOrder.findMany({ where: { ticketId, status: "COMPLETED" }, include: { parts: true } }),
      ticket ? contractRepository.findActiveByClientId(ticket.clientId) : Promise.resolve(null)
    ]);
    return record
      ? mapTicketBilling(record, buildOsContributions(completedOrders), activeContract ?? undefined)
      : null;
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

      const transitionData = {
        invoiceNumber: normalizeOptionalString(input.invoiceNumber),
        invoiceDueDate: toOptionalDate(input.invoiceDueDate),
        paymentMethod: normalizeOptionalString(input.paymentMethod),
        paymentDate: toOptionalDate(input.paymentDate),
        paymentReference: normalizeOptionalString(input.paymentReference),
        cancellationReason: normalizeOptionalString(input.cancellationReason)
      };

      const record = await tx.ticketBilling.upsert({
        where: { ticketId },
        create: {
          ticketId,
          billingType: input.billingType,
          financialStatus: input.financialStatus,
          discountAmount: toMoney(input.discountAmount),
          internalNotes: normalizeOptionalString(input.internalNotes),
          ...transitionData,
          ...timestamps
        },
        update: {
          billingType: input.billingType,
          financialStatus: input.financialStatus,
          discountAmount: toMoney(input.discountAmount),
          internalNotes: normalizeOptionalString(input.internalNotes),
          ...transitionData,
          ...timestamps
        },
        include: ticketBillingInclude
      });

      const message = buildTransitionMessage(current?.financialStatus ?? null, input);

      await tx.billingHistory.create({
        data: {
          ticketBillingId: record.id,
          authorId: input.authorId,
          eventType: !current || current.financialStatus !== input.financialStatus ? "STATUS_UPDATED" : "SUMMARY_UPDATED",
          message
        }
      });

      return recalculateTotals(tx, record.id);
    });
  },

  async addEntry(ticketId: string, input: CreateBillingEntryInput) {
    return prisma.$transaction(async (tx) => {
      const billing = await tx.ticketBilling.upsert({
        where: { ticketId },
        create: { ticketId },
        update: {},
        select: { id: true }
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
          message: `Lançamento criado: ${getEntryTypeLabel(input.entryType)} — ${input.description}.`
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

      if (!billing) return null;

      const existingEntry = await tx.billingEntry.findFirst({
        where: { id: entryId, ticketBillingId: billing.id },
        select: { id: true }
      });

      if (!existingEntry) return null;

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
          message: `Lançamento atualizado: ${getEntryTypeLabel(input.entryType)} — ${input.description}.`
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

      if (!billing) return null;

      const existingEntry = await tx.billingEntry.findFirst({
        where: { id: entryId, ticketBillingId: billing.id },
        select: { id: true, entryType: true, description: true }
      });

      if (!existingEntry) return null;

      await tx.billingEntry.delete({ where: { id: entryId } });

      await tx.billingHistory.create({
        data: {
          ticketBillingId: billing.id,
          authorId,
          eventType: "ENTRY_DELETED",
          message: `Lançamento removido: ${getEntryTypeLabel(existingEntry.entryType)} — ${existingEntry.description}.`
        }
      });

      return recalculateTotals(tx, billing.id);
    });
  }
};
