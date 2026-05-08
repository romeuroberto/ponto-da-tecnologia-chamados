import { prisma } from "@/lib/db/prisma";
import type { RecurringExpense } from "@/types";
import { mapRecurringExpense } from "@/server/mappers";
import type { RecurringExpenseInput } from "@/lib/validations/expense";

const include = { createdBy: true } as const;

function getFrequencyMonths(frequency: RecurringExpense["frequency"]): number {
  const map = { MENSAL: 1, BIMESTRAL: 2, TRIMESTRAL: 3, SEMESTRAL: 6, ANUAL: 12 };
  return map[frequency];
}

function clampDay(day: number, year: number, month: number): number {
  const maxDay = new Date(year, month, 0).getDate();
  return Math.min(day, maxDay);
}

function monthsBetween(startYear: number, startMonth: number, endYear: number, endMonth: number): number {
  return (endYear - startYear) * 12 + (endMonth - startMonth);
}

export const recurringExpenseRepository = {
  async listAll(): Promise<RecurringExpense[]> {
    const records = await prisma.recurringExpense.findMany({
      include,
      orderBy: { createdAt: "asc" }
    });
    return records.map(mapRecurringExpense);
  },

  async findById(id: string): Promise<RecurringExpense | null> {
    const record = await prisma.recurringExpense.findUnique({ where: { id }, include });
    return record ? mapRecurringExpense(record) : null;
  },

  async create(input: RecurringExpenseInput, createdById: string): Promise<RecurringExpense> {
    const record = await prisma.recurringExpense.create({
      data: {
        description: input.description,
        category: input.category,
        baseAmount: input.baseAmount,
        paymentMethod: input.paymentMethod || null,
        frequency: input.frequency,
        dayOfMonth: input.dayOfMonth,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        notes: input.notes || null,
        createdById
      },
      include
    });
    return mapRecurringExpense(record);
  },

  async update(id: string, input: RecurringExpenseInput): Promise<RecurringExpense | null> {
    const existing = await prisma.recurringExpense.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return null;

    const record = await prisma.recurringExpense.update({
      where: { id },
      data: {
        description: input.description,
        category: input.category,
        baseAmount: input.baseAmount,
        paymentMethod: input.paymentMethod || null,
        frequency: input.frequency,
        dayOfMonth: input.dayOfMonth,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        notes: input.notes || null
      },
      include
    });
    return mapRecurringExpense(record);
  },

  async setActive(id: string, active: boolean): Promise<void> {
    await prisma.recurringExpense.update({ where: { id }, data: { active } });
  },

  async generateOccurrences(): Promise<void> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const actives = await prisma.recurringExpense.findMany({
      where: { active: true },
      include: { createdBy: true }
    });

    for (const re of actives) {
      const startDate = new Date(re.startDate);
      const endDate = re.endDate ? new Date(re.endDate) : null;
      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth() + 1;
      const intervalMonths = getFrequencyMonths(re.frequency as RecurringExpense["frequency"]);

      let year = startYear;
      let month = startMonth;

      while (year < currentYear || (year === currentYear && month <= currentMonth)) {
        if (endDate) {
          const endYear = endDate.getFullYear();
          const endMonth = endDate.getMonth() + 1;
          if (year > endYear || (year === endYear && month > endMonth)) break;
        }

        const offset = monthsBetween(startYear, startMonth, year, month);
        if (offset % intervalMonths === 0) {
          const exists = await prisma.expense.findFirst({
            where: { recurringExpenseId: re.id, referenceYear: year, referenceMonth: month },
            select: { id: true }
          });

          if (!exists) {
            const day = clampDay(re.dayOfMonth, year, month);
            await prisma.expense.create({
              data: {
                description: re.description,
                category: re.category,
                amount: re.baseAmount,
                status: "PENDENTE",
                expenseDate: new Date(year, month - 1, day),
                paymentMethod: re.paymentMethod,
                notes: re.notes,
                recurringExpenseId: re.id,
                referenceMonth: month,
                referenceYear: year,
                createdById: re.createdById
              }
            });
          }
        }

        month++;
        if (month > 12) { month = 1; year++; }
      }
    }
  }
};
