import { prisma } from "@/lib/db/prisma";
import type { PaymentInstruction } from "@/types";
import { isDatabaseConfigured } from "@/server/db-support";
import { mapPaymentInstruction } from "@/server/mappers";
import { isMissingTableError } from "@/server/repositories/portal-support";

export const paymentInstructionRepository = {
  async listAll(): Promise<PaymentInstruction[]> {
    if (!isDatabaseConfigured()) {
      return [];
    }

    try {
      const records = await prisma.paymentInstruction.findMany({
        orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
      });

      return records.map(mapPaymentInstruction);
    } catch (error) {
      if (isMissingTableError(error, "PaymentInstruction")) {
        return [];
      }

      throw error;
    }
  },

  async listActiveForClient(clientId: string): Promise<PaymentInstruction[]> {
    if (!isDatabaseConfigured()) {
      return [];
    }

    try {
      const records = await prisma.paymentInstruction.findMany({
        where: {
          active: true,
          OR: [{ clientId }, { clientId: null }]
        },
        orderBy: [{ clientId: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
      });

      return records.map(mapPaymentInstruction);
    } catch (error) {
      if (isMissingTableError(error, "PaymentInstruction")) {
        return [];
      }

      throw error;
    }
  },

  async create(input: {
    clientId?: string;
    title: string;
    paymentChannel: string;
    pixKey?: string;
    pixCopyPaste?: string;
    qrCodeImagePath?: string;
    bankName?: string;
    bankAgency?: string;
    bankAccount?: string;
    accountHolder?: string;
    accountDocument?: string;
    notes?: string;
    active: boolean;
    sortOrder: number;
  }): Promise<PaymentInstruction> {
    const record = await prisma.paymentInstruction.create({
      data: {
        clientId: input.clientId ?? null,
        title: input.title,
        paymentChannel: input.paymentChannel,
        pixKey: input.pixKey ?? null,
        pixCopyPaste: input.pixCopyPaste ?? null,
        qrCodeImagePath: input.qrCodeImagePath ?? null,
        bankName: input.bankName ?? null,
        bankAgency: input.bankAgency ?? null,
        bankAccount: input.bankAccount ?? null,
        accountHolder: input.accountHolder ?? null,
        accountDocument: input.accountDocument ?? null,
        notes: input.notes ?? null,
        active: input.active,
        sortOrder: input.sortOrder
      }
    });

    return mapPaymentInstruction(record);
  },

  async update(
    id: string,
    input: {
      clientId?: string;
      title: string;
      paymentChannel: string;
      pixKey?: string;
      pixCopyPaste?: string;
      qrCodeImagePath?: string;
      bankName?: string;
      bankAgency?: string;
      bankAccount?: string;
      accountHolder?: string;
      accountDocument?: string;
      notes?: string;
      active: boolean;
      sortOrder: number;
    }
  ): Promise<PaymentInstruction | null> {
    try {
      const record = await prisma.paymentInstruction.update({
        where: { id },
        data: {
          clientId: input.clientId ?? null,
          title: input.title,
          paymentChannel: input.paymentChannel,
          pixKey: input.pixKey ?? null,
          pixCopyPaste: input.pixCopyPaste ?? null,
          qrCodeImagePath: input.qrCodeImagePath ?? null,
          bankName: input.bankName ?? null,
          bankAgency: input.bankAgency ?? null,
          bankAccount: input.bankAccount ?? null,
          accountHolder: input.accountHolder ?? null,
          accountDocument: input.accountDocument ?? null,
          notes: input.notes ?? null,
          active: input.active,
          sortOrder: input.sortOrder
        }
      });

      return mapPaymentInstruction(record);
    } catch (error) {
      if (String(error).includes("Record to update not found")) {
        return null;
      }

      throw error;
    }
  },

  async findById(id: string): Promise<PaymentInstruction | null> {
    try {
      const record = await prisma.paymentInstruction.findUnique({ where: { id } });
      return record ? mapPaymentInstruction(record) : null;
    } catch {
      return null;
    }
  },

  async updateQrCodePath(id: string, qrCodeImagePath: string | null): Promise<void> {
    await prisma.paymentInstruction.update({
      where: { id },
      data: { qrCodeImagePath }
    });
  },

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.paymentInstruction.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      if (String(error).includes("Record to delete does not exist")) {
        return false;
      }

      throw error;
    }
  }
};
