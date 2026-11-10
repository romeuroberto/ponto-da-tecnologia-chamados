import { describe, expect, it } from "vitest";
import {
  canCommentTicket,
  canCreateClient,
  canCreateTicket,
  canEditTicketAssignment,
  canEditTicketPriority,
  canEditTicketStatus,
  canManageAssignedServiceOrder,
  canManageTicketBilling,
  canManageUsers,
  canOperateOnTicket,
  canViewClientsModule,
  canViewFinancialModule,
  canViewTicketsModule,
  canViewUsersModule
} from "@/server/auth/permissions";
import type { UserRole } from "@/types";

type Matrix = Record<string, [check: (role: UserRole) => boolean, allowed: UserRole[]]>;

// Matriz de permissões documentada no AGENTS.md.
const matrix: Matrix = {
  "acessar usuários": [canViewUsersModule, ["ADMIN"]],
  "gerenciar usuários": [canManageUsers, ["ADMIN"]],
  "acessar clientes": [canViewClientsModule, ["ADMIN", "ATTENDANT", "TECHNICIAN"]],
  "criar clientes": [canCreateClient, ["ADMIN", "ATTENDANT"]],
  "acessar chamados": [canViewTicketsModule, ["ADMIN", "ATTENDANT", "TECHNICIAN"]],
  "criar chamados": [canCreateTicket, ["ADMIN", "ATTENDANT"]],
  "alterar status": [canEditTicketStatus, ["ADMIN", "ATTENDANT", "TECHNICIAN"]],
  "alterar prioridade": [canEditTicketPriority, ["ADMIN", "ATTENDANT"]],
  "alterar responsável": [canEditTicketAssignment, ["ADMIN", "ATTENDANT"]],
  "comentar": [canCommentTicket, ["ADMIN", "ATTENDANT", "TECHNICIAN"]],
  "acessar financeiro": [canViewFinancialModule, ["ADMIN", "ATTENDANT"]],
  "gerenciar financeiro do chamado": [canManageTicketBilling, ["ADMIN", "ATTENDANT"]]
};

const roles: UserRole[] = ["ADMIN", "ATTENDANT", "TECHNICIAN", "CLIENT"];

describe("matriz de permissões", () => {
  for (const [action, [check, allowed]] of Object.entries(matrix)) {
    it.each(roles)(`${action}: %s`, (role) => {
      expect(check(role)).toBe(allowed.includes(role));
    });
  }
});

describe("canOperateOnTicket", () => {
  it("permite administradores e atendentes em qualquer chamado", () => {
    expect(canOperateOnTicket("ADMIN", "u1", "u2")).toBe(true);
    expect(canOperateOnTicket("ATTENDANT", "u1", "u2")).toBe(true);
  });

  it("restringe técnicos aos próprios chamados ou sem responsável", () => {
    expect(canOperateOnTicket("TECHNICIAN", "u1", "u1")).toBe(true);
    expect(canOperateOnTicket("TECHNICIAN", "u1")).toBe(true);
    expect(canOperateOnTicket("TECHNICIAN", "u1", "u2")).toBe(false);
  });

  it("bloqueia clientes", () => {
    expect(canOperateOnTicket("CLIENT", "u1")).toBe(false);
  });
});

describe("canManageAssignedServiceOrder", () => {
  it("exige que o técnico seja o responsável pela OS", () => {
    expect(canManageAssignedServiceOrder("TECHNICIAN", "u1", "u1")).toBe(true);
    expect(canManageAssignedServiceOrder("TECHNICIAN", "u1")).toBe(false);
    expect(canManageAssignedServiceOrder("TECHNICIAN", "u1", "u2")).toBe(false);
    expect(canManageAssignedServiceOrder("ATTENDANT", "u1", "u2")).toBe(true);
  });
});
