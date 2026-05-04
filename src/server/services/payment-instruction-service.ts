import { isDatabaseConfigured, normalizeOptionalString } from "@/server/db-support";
import { paymentInstructionRepository } from "@/server/repositories/payment-instruction-repository";

export interface PaymentInstructionInput {
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

export const paymentInstructionService = {
  async listAll() {
    return paymentInstructionRepository.listAll();
  },

  async create(input: PaymentInstructionInput) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada. Configure o banco antes de cadastrar meios de pagamento.");
    }

    return paymentInstructionRepository.create({
      ...input,
      clientId: normalizeOptionalString(input.clientId),
      pixKey: normalizeOptionalString(input.pixKey),
      pixCopyPaste: normalizeOptionalString(input.pixCopyPaste),
      qrCodeImagePath: normalizeOptionalString(input.qrCodeImagePath),
      bankName: normalizeOptionalString(input.bankName),
      bankAgency: normalizeOptionalString(input.bankAgency),
      bankAccount: normalizeOptionalString(input.bankAccount),
      accountHolder: normalizeOptionalString(input.accountHolder),
      accountDocument: normalizeOptionalString(input.accountDocument),
      notes: normalizeOptionalString(input.notes)
    });
  },

  async update(id: string, input: PaymentInstructionInput) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada. Configure o banco antes de editar meios de pagamento.");
    }

    const updated = await paymentInstructionRepository.update(id, {
      ...input,
      clientId: normalizeOptionalString(input.clientId),
      pixKey: normalizeOptionalString(input.pixKey),
      pixCopyPaste: normalizeOptionalString(input.pixCopyPaste),
      qrCodeImagePath: normalizeOptionalString(input.qrCodeImagePath),
      bankName: normalizeOptionalString(input.bankName),
      bankAgency: normalizeOptionalString(input.bankAgency),
      bankAccount: normalizeOptionalString(input.bankAccount),
      accountHolder: normalizeOptionalString(input.accountHolder),
      accountDocument: normalizeOptionalString(input.accountDocument),
      notes: normalizeOptionalString(input.notes)
    });

    if (!updated) {
      throw new Error("Instrução de pagamento não encontrada.");
    }

    return updated;
  },

  async delete(id: string) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada. Configure o banco antes de remover meios de pagamento.");
    }

    const deleted = await paymentInstructionRepository.delete(id);

    if (!deleted) {
      throw new Error("Instrução de pagamento não encontrada.");
    }

    return deleted;
  }
};
