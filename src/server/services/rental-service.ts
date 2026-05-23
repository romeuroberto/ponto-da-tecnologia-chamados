import { equipmentRepository, type UpsertEquipmentInput } from "@/server/repositories/equipment-repository";
import { equipmentLoanRepository, type CreateLoanInput } from "@/server/repositories/equipment-loan-repository";
import {
  rentalRepository,
  type AddRentalItemInput,
  type CreateRentalBillingInput,
  type CreateRentalContractInput,
  type PayRentalBillingInput
} from "@/server/repositories/rental-repository";
import type { Equipment, EquipmentLoan, EquipmentStatus, RentalBilling, RentalContract, RentalContractStatus } from "@/types";

export const rentalService = {
  // ── Equipment ──────────────────────────────────────────────────────────────
  async listEquipment(filters: { status?: EquipmentStatus; q?: string } = {}): Promise<Equipment[]> {
    return equipmentRepository.list(filters);
  },

  async getEquipment(id: string): Promise<Equipment | null> {
    return equipmentRepository.findById(id);
  },

  async createEquipment(input: UpsertEquipmentInput): Promise<Equipment> {
    return equipmentRepository.create(input);
  },

  async updateEquipment(
    id: string,
    input: Partial<UpsertEquipmentInput> & { status?: EquipmentStatus }
  ): Promise<Equipment | null> {
    return equipmentRepository.update(id, input);
  },

  async deleteEquipment(id: string): Promise<void> {
    return equipmentRepository.delete(id);
  },

  // ── Rental contracts ───────────────────────────────────────────────────────
  async listContracts(filters: { clientId?: string; status?: RentalContractStatus } = {}): Promise<RentalContract[]> {
    return rentalRepository.list(filters);
  },

  async getContract(id: string): Promise<RentalContract | null> {
    return rentalRepository.findById(id);
  },

  async createContract(input: CreateRentalContractInput): Promise<RentalContract> {
    return rentalRepository.create(input);
  },

  async updateContractStatus(id: string, status: RentalContractStatus): Promise<RentalContract | null> {
    return rentalRepository.updateStatus(id, status);
  },

  async addItem(contractId: string, input: AddRentalItemInput): Promise<RentalContract | null> {
    return rentalRepository.addItem(contractId, input);
  },

  async returnItem(itemId: string, returnedAt: string): Promise<RentalContract | null> {
    return rentalRepository.returnItem(itemId, returnedAt);
  },

  async deleteItem(itemId: string): Promise<void> {
    return rentalRepository.deleteItem(itemId);
  },

  async updateItemPrice(itemId: string, newPrice: number, updateBillings: boolean): Promise<RentalContract | null> {
    return rentalRepository.updateItemPrice(itemId, newPrice, updateBillings);
  },

  // ── Reserve loans ─────────────────────────────────────────────────────────
  async listActiveLoans(): Promise<EquipmentLoan[]> {
    return equipmentLoanRepository.listActive();
  },

  async listLoansByEquipment(equipmentId: string): Promise<EquipmentLoan[]> {
    return equipmentLoanRepository.listByEquipment(equipmentId);
  },

  async createLoan(input: CreateLoanInput): Promise<EquipmentLoan> {
    return equipmentLoanRepository.create(input);
  },

  async registerLoanReturn(loanId: string, returnedAt: string): Promise<EquipmentLoan | null> {
    return equipmentLoanRepository.registerReturn(loanId, returnedAt);
  },

  // ── Billings ───────────────────────────────────────────────────────────────
  async createBilling(input: CreateRentalBillingInput): Promise<RentalBilling> {
    return rentalRepository.createBilling(input);
  },

  async updateBillingStatus(id: string, input: PayRentalBillingInput): Promise<RentalBilling | null> {
    return rentalRepository.updateBillingStatus(id, input);
  },

  async deleteBilling(id: string): Promise<void> {
    return rentalRepository.deleteBilling(id);
  }
};
