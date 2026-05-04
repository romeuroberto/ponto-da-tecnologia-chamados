import bcrypt from "bcryptjs";

import type { UserInput } from "@/lib/validations/user";
import { isDatabaseConfigured } from "@/server/db-support";
import { userRepository } from "@/server/repositories/user-repository";
import type { UserSearchInput } from "@/server/repositories/user-repository";

export const userService = {
  async listUsers() {
    return userRepository.list();
  },
  async listAssignableUsers() {
    return userRepository.listAssignable();
  },
  async searchUsers(filters: UserSearchInput) {
    return userRepository.search(filters);
  },
  async getUser(id: string) {
    return userRepository.findById(id);
  },
  async createUser(input: UserInput) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada. Configure o banco antes de gravar usuários reais.");
    }

    return userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password || "change-me", 10),
      role: input.role
    });
  },
  async updateUser(id: string, input: UserInput) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada. Configure o banco antes de atualizar usuários reais.");
    }

    return userRepository.update(id, {
      name: input.name,
      email: input.email,
      passwordHash: input.password ? await bcrypt.hash(input.password, 10) : undefined,
      role: input.role
    });
  },

  async getPortalUserByClientId(clientId: string) {
    const record = await userRepository.findByClientId(clientId);
    return record ?? null;
  },

  async createClientAccess(clientId: string, name: string, email: string, password: string) {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL não configurada.");
    }

    return userRepository.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "CLIENT",
      clientId
    });
  }
};
