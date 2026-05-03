import type { Ticket, TicketPriority, TicketStatus } from "@/types";

const SLA_HOURS_BY_PRIORITY: Record<TicketPriority, number> = {
  LOW: 48,
  MEDIUM: 24,
  HIGH: 8,
  CRITICAL: 4
};

const ACTIVE_STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"];

export type SlaState = "on_track" | "warning" | "breached" | "stopped";

export function isActiveSlaStatus(status: TicketStatus) {
  return ACTIVE_STATUSES.includes(status);
}

export function getSlaTargetHours(priority: TicketPriority) {
  return SLA_HOURS_BY_PRIORITY[priority];
}

export function getSlaInfo(ticket: Pick<Ticket, "priority" | "status" | "createdAt">, now = new Date()) {
  const targetHours = getSlaTargetHours(ticket.priority);
  const createdAt = new Date(ticket.createdAt);
  const deadline = new Date(createdAt.getTime() + targetHours * 60 * 60 * 1000);
  const limitMs = targetHours * 60 * 60 * 1000;
  const elapsedMs = now.getTime() - createdAt.getTime();
  const remainingMs = deadline.getTime() - now.getTime();

  if (!isActiveSlaStatus(ticket.status)) {
    return {
      state: "stopped" as const,
      targetHours,
      deadline,
      elapsedMs,
      remainingMs
    };
  }

  if (remainingMs < 0) {
    return {
      state: "breached" as const,
      targetHours,
      deadline,
      elapsedMs,
      remainingMs
    };
  }

  if (elapsedMs / limitMs >= 0.75) {
    return {
      state: "warning" as const,
      targetHours,
      deadline,
      elapsedMs,
      remainingMs
    };
  }

  return {
    state: "on_track" as const,
    targetHours,
    deadline,
    elapsedMs,
    remainingMs
  };
}

export function formatSlaTime(remainingMs: number) {
  const totalMinutes = Math.max(1, Math.round(Math.abs(remainingMs) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const time = hours > 0 ? `${hours}h${minutes > 0 ? ` ${minutes}min` : ""}` : `${minutes}min`;

  return remainingMs < 0 ? `${time} atrasado` : `${time} restante`;
}

export function getSlaLabel(ticket: Pick<Ticket, "priority" | "status" | "createdAt">, now = new Date()) {
  const info = getSlaInfo(ticket, now);

  if (info.state === "stopped") {
    return "SLA encerrado";
  }

  if (info.state === "breached") {
    return `SLA vencido - ${formatSlaTime(info.remainingMs)}`;
  }

  if (info.state === "warning") {
    return `SLA em risco - ${formatSlaTime(info.remainingMs)}`;
  }

  return `SLA dentro - ${formatSlaTime(info.remainingMs)}`;
}
