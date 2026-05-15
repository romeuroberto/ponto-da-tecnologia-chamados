import type { Ticket, TicketPriority, TicketStatus } from "@/types";

const SLA_HOURS_BY_PRIORITY: Record<TicketPriority, number> = {
  LOW: 48,
  MEDIUM: 24,
  HIGH: 8,
  CRITICAL: 4
};

const ACTIVE_STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"];

export type SlaState = "on_track" | "warning" | "breached" | "paused" | "stopped";

export function isActiveSlaStatus(status: TicketStatus) {
  return ACTIVE_STATUSES.includes(status);
}

export function getSlaTargetHours(priority: TicketPriority) {
  return SLA_HOURS_BY_PRIORITY[priority];
}

type SlaTicket = Pick<Ticket, "priority" | "status" | "createdAt"> & {
  slaWaitingPartsMs?: number;
  waitingPartsStartedAt?: string;
};

export function getSlaInfo(ticket: SlaTicket, now = new Date()) {
  const targetHours = getSlaTargetHours(ticket.priority);
  const createdAt = new Date(ticket.createdAt);
  const limitMs = targetHours * 60 * 60 * 1000;

  const accumulatedWaitMs = ticket.slaWaitingPartsMs ?? 0;
  const currentWaitMs =
    ticket.status === "WAITING_PARTS" && ticket.waitingPartsStartedAt
      ? now.getTime() - new Date(ticket.waitingPartsStartedAt).getTime()
      : 0;
  const totalWaitingPartsMs = accumulatedWaitMs + currentWaitMs;

  const rawElapsedMs = now.getTime() - createdAt.getTime();
  const elapsedMs = Math.max(0, rawElapsedMs - totalWaitingPartsMs);
  const remainingMs = limitMs - elapsedMs;
  const deadline = new Date(createdAt.getTime() + limitMs + totalWaitingPartsMs);

  if (ticket.status === "WAITING_PARTS") {
    return { state: "paused" as const, targetHours, deadline, elapsedMs, remainingMs };
  }

  if (!isActiveSlaStatus(ticket.status)) {
    return { state: "stopped" as const, targetHours, deadline, elapsedMs, remainingMs };
  }

  if (remainingMs < 0) {
    return { state: "breached" as const, targetHours, deadline, elapsedMs, remainingMs };
  }

  if (elapsedMs / limitMs >= 0.75) {
    return { state: "warning" as const, targetHours, deadline, elapsedMs, remainingMs };
  }

  return { state: "on_track" as const, targetHours, deadline, elapsedMs, remainingMs };
}

export function formatSlaTime(remainingMs: number) {
  const totalMinutes = Math.max(1, Math.round(Math.abs(remainingMs) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const time = hours > 0 ? `${hours}h${minutes > 0 ? ` ${minutes}min` : ""}` : `${minutes}min`;

  return remainingMs < 0 ? `${time} atrasado` : `${time} restante`;
}

export function getSlaLabel(ticket: SlaTicket, now = new Date()) {
  const info = getSlaInfo(ticket, now);

  if (info.state === "stopped") return "SLA encerrado";
  if (info.state === "paused") return `SLA pausado - ${formatSlaTime(info.remainingMs)} ao retomar`;
  if (info.state === "breached") return `SLA vencido - ${formatSlaTime(info.remainingMs)}`;
  if (info.state === "warning") return `SLA em risco - ${formatSlaTime(info.remainingMs)}`;

  return `SLA dentro - ${formatSlaTime(info.remainingMs)}`;
}
