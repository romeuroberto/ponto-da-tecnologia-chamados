import type { AppUser } from "@/types";

const roleLabels: Record<AppUser["role"], string> = {
  ADMIN: "Admin",
  ATTENDANT: "Atendente",
  TECHNICIAN: "Tecnico"
};

const attendantFirstKeywords = ["acesso", "e-mail", "email", "office", "cadastro", "liberacao", "liberação"];
const technicianFirstKeywords = [
  "infraestrutura",
  "rede",
  "hardware",
  "backup",
  "banco de dados",
  "sistema",
  "seguranca",
  "segurança",
  "pdv",
  "telefonia"
];

export function getUserRoleLabel(role: AppUser["role"]) {
  return roleLabels[role];
}

export function formatUserWithRole(user: Pick<AppUser, "name" | "role">) {
  return `${user.name} - ${getUserRoleLabel(user.role)}`;
}

export function getSuggestedRoleForCategory(category?: string) {
  const normalized = category?.trim().toLowerCase();

  if (!normalized) {
    return {
      role: null,
      label: "Sem sugestao automatica",
      description: "Defina a categoria para o sistema priorizar atendentes ou tecnicos na atribuicao."
    };
  }

  if (attendantFirstKeywords.some((keyword) => normalized.includes(keyword))) {
    return {
      role: "ATTENDANT" as const,
      label: "Atendentes sugeridos",
      description: "Para esta categoria, atendentes aparecem primeiro por se tratar de triagem, acesso ou suporte administrativo."
    };
  }

  if (technicianFirstKeywords.some((keyword) => normalized.includes(keyword))) {
    return {
      role: "TECHNICIAN" as const,
      label: "Tecnicos sugeridos",
      description: "Para esta categoria, tecnicos aparecem primeiro por se tratar de demanda mais tecnica."
    };
  }

  return {
    role: "TECHNICIAN" as const,
    label: "Tecnicos sugeridos",
    description: "Sem regra especifica para a categoria. O sistema prioriza tecnicos como sugestao inicial."
  };
}

export function groupAssignableUsers(users: AppUser[], category?: string) {
  const suggestion = getSuggestedRoleForCategory(category);
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
