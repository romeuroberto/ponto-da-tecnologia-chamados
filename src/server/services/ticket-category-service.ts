import { ticketCategoryRepository } from "@/server/repositories/ticket-category-repository";
import type { CreateTicketCategoryInput, UpdateTicketCategoryInput } from "@/server/repositories/ticket-category-repository";

export const ticketCategoryService = {
  async listCategories(onlyActive = false) {
    return ticketCategoryRepository.list(onlyActive);
  },

  async getCategory(id: string) {
    return ticketCategoryRepository.findById(id);
  },

  async createCategory(input: CreateTicketCategoryInput) {
    return ticketCategoryRepository.create(input);
  },

  async updateCategory(id: string, input: UpdateTicketCategoryInput) {
    return ticketCategoryRepository.update(id, input);
  }
};
