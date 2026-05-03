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
