import { getSlaInfo } from "@/lib/sla";
import { ticketService } from "@/server/services/ticket-service";
import type { Ticket, TicketPriority, TicketStatus } from "@/types";

const statusLabels: Record<TicketStatus, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em atendimento",
  WAITING_CUSTOMER: "Aguardando cliente",
  RESOLVED: "Resolvido",
  CLOSED: "Encerrado",
  CANCELED: "Cancelado"
};

const priorityLabels: Record<TicketPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Critica"
};

function buildRange(from?: string, to?: string) {
  return {
    fromDate: from ? new Date(`${from}T00:00:00`) : null,
    toDate: to ? new Date(`${to}T23:59:59`) : null
  };
}

function filterTicketsByRange(tickets: Ticket[], from?: string, to?: string) {
  const { fromDate, toDate } = buildRange(from, to);

  return tickets.filter((ticket) => {
    const createdAt = new Date(ticket.createdAt);

    if (fromDate && createdAt < fromDate) {
      return false;
    }

    if (toDate && createdAt > toDate) {
      return false;
    }

    return true;
  });
}

function getCompletionDate(ticket: Ticket) {
  if (ticket.closedAt) {
    return new Date(ticket.closedAt);
  }

  if (ticket.resolvedAt) {
    return new Date(ticket.resolvedAt);
  }

  if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
    return new Date(ticket.updatedAt);
  }

  return null;
}

function formatDayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildTrend(tickets: Ticket[]) {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  });
  const days: { key: string; label: string }[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    days.push({
      key: formatDayKey(date),
      label: formatter.format(date)
    });
  }

  const openedMap = new Map(days.map((day) => [day.key, 0]));
  const resolvedMap = new Map(days.map((day) => [day.key, 0]));

  tickets.forEach((ticket) => {
    const openedKey = formatDayKey(new Date(ticket.createdAt));
    if (openedMap.has(openedKey)) {
      openedMap.set(openedKey, (openedMap.get(openedKey) ?? 0) + 1);
    }

    const completedAt = getCompletionDate(ticket);
    if (completedAt) {
      const resolvedKey = formatDayKey(completedAt);
      if (resolvedMap.has(resolvedKey)) {
        resolvedMap.set(resolvedKey, (resolvedMap.get(resolvedKey) ?? 0) + 1);
      }
    }
  });

  return days.map((day) => ({
    label: day.label,
    opened: openedMap.get(day.key) ?? 0,
    resolved: resolvedMap.get(day.key) ?? 0
  }));
}

export const reportService = {
  async getOperationalReport(filters: { from?: string; to?: string }) {
    const allTickets = await ticketService.listTickets();
    const tickets = filterTicketsByRange(allTickets, filters.from, filters.to);
    const total = tickets.length;
    const active = tickets.filter((ticket) => ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"].includes(ticket.status)).length;
    const completed = tickets.filter((ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED").length;
    const canceled = tickets.filter((ticket) => ticket.status === "CANCELED").length;

    const slaEvaluated = tickets.map((ticket) => getSlaInfo(ticket));
    const slaBreached = slaEvaluated.filter((item) => item.state === "breached").length;
    const slaWarning = slaEvaluated.filter((item) => item.state === "warning").length;

    const resolutionHours = tickets
      .map((ticket) => {
        const completedAt = getCompletionDate(ticket);
        if (!completedAt) {
          return null;
        }

        return (completedAt.getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60);
      })
      .filter((value): value is number => value !== null);

    const averageResolutionHours =
      resolutionHours.length > 0
        ? Number((resolutionHours.reduce((sum, value) => sum + value, 0) / resolutionHours.length).toFixed(1))
        : null;

    const byStatus = (Object.keys(statusLabels) as TicketStatus[]).map((status) => ({
      status,
      label: statusLabels[status],
      total: tickets.filter((ticket) => ticket.status === status).length
    }));

    const byPriority = (Object.keys(priorityLabels) as TicketPriority[]).map((priority) => ({
      priority,
      label: priorityLabels[priority],
      total: tickets.filter((ticket) => ticket.priority === priority).length
    }));

    const byClient = Array.from(
      tickets.reduce((map, ticket) => {
        const current = map.get(ticket.clientId) ?? {
          clientId: ticket.clientId,
          clientName: ticket.clientName,
          total: 0,
          active: 0,
          completed: 0
        };

        current.total += 1;
        if (["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"].includes(ticket.status)) {
          current.active += 1;
        }
        if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
          current.completed += 1;
        }

        map.set(ticket.clientId, current);
        return map;
      }, new Map<string, { clientId: string; clientName: string; total: number; active: number; completed: number }>()),
      ([, value]) => value
    ).sort((left, right) => right.total - left.total || left.clientName.localeCompare(right.clientName));

    const byAssignee = Array.from(
      tickets.reduce((map, ticket) => {
        const key = ticket.assigneeId ?? "unassigned";
        const current = map.get(key) ?? {
          assigneeId: ticket.assigneeId ?? undefined,
          assigneeName: ticket.assigneeName ?? "Nao atribuido",
          total: 0,
          active: 0,
          completed: 0
        };

        current.total += 1;
        if (["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"].includes(ticket.status)) {
          current.active += 1;
        }
        if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
          current.completed += 1;
        }

        map.set(key, current);
        return map;
      }, new Map<string, { assigneeId?: string; assigneeName: string; total: number; active: number; completed: number }>()),
      ([, value]) => value
    ).sort((left, right) => right.total - left.total || left.assigneeName.localeCompare(right.assigneeName));

    const trend = buildTrend(tickets);

    return {
      filters,
      summary: {
        total,
        active,
        completed,
        canceled,
        slaBreached,
        slaWarning,
        averageResolutionHours
      },
      byStatus,
      byPriority,
      byClient,
      byAssignee,
      trend
    };
  }
};
