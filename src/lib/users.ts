import type { AppUser, TicketCategory } from "@/types";
import { TICKET_CATEGORIES } from "@/lib/ticket-categories";

const roleLabels: Record<AppUser["role"], string> = {
  ADMIN: "Admin",
  ATTENDANT: "Atendente",
  TECHNICIAN: "Técnico",
  CLIENT: "Cliente"
};

export function getUserRoleLabel(role: AppUser["role"]) {
  return roleLabels[role];
}

export function formatUserWithRole(user: Pick<AppUser, "name" | "role">) {
  return `${user.name} - ${getUserRoleLabel(user.role)}`;
}

export function getSuggestedRoleForCategory(category?: string, categories?: TicketCategory[]) {
  if (!category) {
    return {
      role: null,
      label: "Sem sugestão automática",
      description: "Defina a categoria para o sistema priorizar atendentes ou técnicos na atribuição."
    };
  }

  const dynamicCat = categories?.find((c) => c.name === category);
  const staticCat = TICKET_CATEGORIES.find((c) => c.value === category);
  const suggestedRole = dynamicCat?.suggestedRole ?? staticCat?.suggestedRole ?? "TECHNICIAN";

  if (suggestedRole === "ATTENDANT") {
    return {
      role: "ATTENDANT" as const,
      label: "Atendentes sugeridos",
      description: "Para esta categoria, atendentes aparecem primeiro por se tratar de triagem, acesso ou suporte administrativo."
    };
  }

  return {
    role: "TECHNICIAN" as const,
    label: "Técnicos sugeridos",
    description: "Para esta categoria, técnicos aparecem primeiro por se tratar de demanda mais técnica."
  };
}

export function groupAssignableUsers(users: AppUser[], category?: string, categories?: TicketCategory[]) {
  const suggestion = getSuggestedRoleForCategory(category, categories);
  const sortedUsers = [...users].sort((left, right) => left.name.localeCompare(right.name));

  if (!suggestion.role) {
    return {
      suggestion,
      suggestedUsers: sortedUsers,
      otherUsers: [] as AppUser[]
    };
  }

  return {
    suggestion,
    suggestedUsers: sortedUsers.filter((user) => user.role === suggestion.role),
    otherUsers: sortedUsers.filter((user) => user.role !== suggestion.role)
  };
}
