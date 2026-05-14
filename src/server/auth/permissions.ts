import type { UserRole } from "@/types";

export function canViewUsersModule(role: UserRole) {
  return role === "ADMIN";
}

export function canManageUsers(role: UserRole) {
  return role === "ADMIN";
}

export function canViewClientsModule(role: UserRole) {
  return role === "ADMIN" || role === "ATTENDANT" || role === "TECHNICIAN";
}

export function canCreateClient(role: UserRole) {
  return role === "ADMIN" || role === "ATTENDANT";
}

export function canEditClient(role: UserRole) {
  return role === "ADMIN" || role === "ATTENDANT";
}

export function canViewTicketsModule(role: UserRole) {
  return role === "ADMIN" || role === "ATTENDANT" || role === "TECHNICIAN";
}

export function canCreateTicket(role: UserRole) {
  return role === "ADMIN" || role === "ATTENDANT";
}

export function canEditTicketAssignment(role: UserRole) {
  return role === "ADMIN" || role === "ATTENDANT";
}

export function canEditTicketPriority(role: UserRole) {
  return role === "ADMIN" || role === "ATTENDANT";
}

export function canEditTicketStatus(role: UserRole) {
  return role === "ADMIN" || role === "ATTENDANT" || role === "TECHNICIAN";
}

export function canCommentTicket(role: UserRole) {
  return role === "ADMIN" || role === "ATTENDANT" || role === "TECHNICIAN";
}

export function canOperateOnTicket(role: UserRole, userId: string, assigneeId?: string) {
  if (role === "ADMIN" || role === "ATTENDANT") {
    return true;
  }

  if (role !== "TECHNICIAN") {
    return false;
  }

  return !assigneeId || assigneeId === userId;
}

export function canManageAssignedServiceOrder(role: UserRole, userId: string, assignedTechnicianId?: string) {
  if (role === "ADMIN" || role === "ATTENDANT") {
    return true;
  }

  if (role !== "TECHNICIAN") {
    return false;
  }

  return assignedTechnicianId === userId;
}

export function canViewFinancialModule(role: UserRole) {
  return role === "ADMIN" || role === "ATTENDANT";
}

export function canManageTicketBilling(role: UserRole) {
  return role === "ADMIN" || role === "ATTENDANT";
}

export function canManageExpenses(role: UserRole) {
  return role === "ADMIN" || role === "ATTENDANT";
}

export function canManageCompanyProfile(role: UserRole) {
  return role === "ADMIN";
}

export function canManagePaymentInstructions(role: UserRole) {
  return role === "ADMIN" || role === "ATTENDANT";
}

export function canManageFiscalDocuments(role: UserRole) {
  return role === "ADMIN" || role === "ATTENDANT";
}

export function canViewCatalogModule(role: UserRole) {
  return role === "ADMIN";
}

export function canViewSalesModule(role: UserRole) {
  return role === "ADMIN" || role === "ATTENDANT";
}

export function canManageSales(role: UserRole) {
  return role === "ADMIN" || role === "ATTENDANT";
}

export function canManageStock(role: UserRole) {
  return role === "ADMIN";
}
