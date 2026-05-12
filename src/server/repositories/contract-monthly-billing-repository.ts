import { prisma } from "@/lib/db/prisma";

export interface MonthlyBillingItem {
  id: string;
  contractId: string;
  contractNumber: string;
  clientId: string;
  referenceMonth: number;
  referenceYear: number;
  amount: number;
  financialStatus: string;
  paidAt: string | null;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string;
}

export const contractMonthlyBillingRepository = {
  async generatePending(clientId: string): Promise<void> {
    const now = new Date();
    const contracts = await prisma.clientContract.findMany({
      where: {
        clientId,
        status: "ATIVO",
        monthlyValue: { not: null }
      }
    });

    for (const contract of contracts) {
      if (!contract.monthlyValue) continue;
      const start = new Date(contract.startDate);
      const end = contract.endDate ? new Date(contract.endDate) : now;
      const endMonth = end < now ? end : now;

      let year = start.getFullYear();
      let month = start.getMonth() + 1;

      while (year < endMonth.getFullYear() || (year === endMonth.getFullYear() && month <= endMonth.getMonth() + 1)) {
        await prisma.contractMonthlyBilling.upsert({
          where: {
            contractId_referenceYear_referenceMonth: {
              contractId: contract.id,
              referenceYear: year,
              referenceMonth: month
            }
          },
          create: {
            contractId: contract.id,
            clientId,
            referenceYear: year,
            referenceMonth: month,
            amount: contract.monthlyValue
          },
          update: {}
        });

        month++;
        if (month > 12) {
          month = 1;
          year++;
        }
      }
    }
  },

  async listByClient(clientId: string): Promise<MonthlyBillingItem[]> {
    const records = await prisma.contractMonthlyBilling.findMany({
      where: { clientId },
      include: { contract: { select: { contractNumber: true } } },
      orderBy: [{ referenceYear: "desc" }, { referenceMonth: "desc" }]
    });
    return records.map((r) => ({
      id: r.id,
      contractId: r.contractId,
      contractNumber: r.contract.contractNumber,
      clientId: r.clientId,
      referenceMonth: r.referenceMonth,
      referenceYear: r.referenceYear,
      amount: r.amount.toNumber(),
      financialStatus: r.financialStatus,
      paidAt: r.paidAt?.toISOString() ?? null,
      paymentMethod: r.paymentMethod,
      notes: r.notes,
      createdAt: r.createdAt.toISOString()
    }));
  },

  async markAsPaid(
    id: string,
    data: { paymentMethod: string; paidAt: string }
  ): Promise<MonthlyBillingItem | null> {
    const existing = await prisma.contractMonthlyBilling.findUnique({ where: { id } });
    if (!existing) return null;

    const record = await prisma.contractMonthlyBilling.update({
      where: { id },
      data: {
        financialStatus: "PAGO",
        paidAt: new Date(data.paidAt),
        paymentMethod: data.paymentMethod
      },
      include: { contract: { select: { contractNumber: true } } }
    });
    return {
      id: record.id,
      contractId: record.contractId,
      contractNumber: record.contract.contractNumber,
      clientId: record.clientId,
      referenceMonth: record.referenceMonth,
      referenceYear: record.referenceYear,
      amount: record.amount.toNumber(),
      financialStatus: record.financialStatus,
      paidAt: record.paidAt?.toISOString() ?? null,
      paymentMethod: record.paymentMethod,
      notes: record.notes,
      createdAt: record.createdAt.toISOString()
    };
  }
};
