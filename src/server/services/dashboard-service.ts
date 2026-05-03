import { prisma } from "@/lib/db/prisma";
import { dashboardSummary, tickets } from "@/lib/mock-data";
import { getSlaInfo } from "@/lib/sla";
import { isDatabaseConfigured } from "@/server/db-support";
import { mapTicket, ticketInclude } from "@/server/mappers";

function formatDayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getTrendDays() {
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

  return days;
}

function buildTrend(records: Array<{ createdAt: string | Date; updatedAt: string | Date; status: string }>) {
  const days = getTrendDays();
  const openedMap = new Map(days.map((day) => [day.key, 0]));
  const resolvedMap = new Map(days.map((day) => [day.key, 0]));

  records.forEach((record) => {
    const createdKey = formatDayKey(new Date(record.createdAt));
    if (openedMap.has(createdKey)) {
      openedMap.set(createdKey, (openedMap.get(createdKey) ?? 0) + 1);
    }

    if (record.status === "RESOLVED" || record.status === "CLOSED") {
      const resolvedKey = formatDayKey(new Date(record.updatedAt));
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

export const dashboardService = {
  async getSummary(currentUserId?: string) {
    if (!isDatabaseConfigured()) {
      const myAssignedTickets = currentUserId
        ? [...tickets]
            .filter((ticket) => ticket.assigneeId === currentUserId)
            .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
        : [];
      const criticalTickets = tickets.filter((ticket) => ticket.priority === "CRITICAL").slice(0, 5);
      const unassignedTickets = tickets.filter((ticket) => !ticket.assigneeId).slice(0, 5);
      const waitingCustomerTickets = tickets.filter((ticket) => ticket.status === "WAITING_CUSTOMER").slice(0, 5);
      const trend = buildTrend(tickets);
      const slaAlerts = [...tickets]
        .map((ticket) => ({ ticket, sla: getSlaInfo(ticket) }))
        .filter((item) => item.sla.state === "breached" || item.sla.state === "warning")
        .sort((left, right) => left.sla.remainingMs - right.sla.remainingMs);
      const slaBreachedTickets = slaAlerts.filter((item) => item.sla.state === "breached").map((item) => item.ticket).slice(0, 5);
      const slaWarningTickets = slaAlerts.filter((item) => item.sla.state === "warning").map((item) => item.ticket).slice(0, 5);
      const workload = Array.from(
        tickets.reduce(
          (map, ticket) => {
            const key = ticket.assigneeName ?? "Não atribuído";
            map.set(key, (map.get(key) ?? 0) + 1);
            return map;
          },
          new Map<string, number>()
        ),
        ([name, total]) => ({ name, total })
      ).sort((left, right) => right.total - left.total);

      return {
        summary: dashboardSummary,
        myAssignedTickets,
        myAssignedCount: myAssignedTickets.length,
        myActiveAssignedCount: myAssignedTickets.filter((ticket) => ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"].includes(ticket.status)).length,
        recentTickets: [...tickets].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 5),
        criticalCount: criticalTickets.length,
        unassignedCount: unassignedTickets.length,
        resolvedTodayCount: tickets.filter((ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED").length,
        criticalTickets,
        unassignedTickets,
        waitingCustomerTickets,
        workload,
        trend,
        openedLast7Days: trend.reduce((total, item) => total + item.opened, 0),
        resolvedLast7Days: trend.reduce((total, item) => total + item.resolved, 0),
        slaBreachedCount: slaAlerts.filter((item) => item.sla.state === "breached").length,
        slaWarningCount: slaAlerts.filter((item) => item.sla.state === "warning").length,
        slaBreachedTickets,
        slaWarningTickets
      };
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTrendWindow = new Date(startOfToday);
    startOfTrendWindow.setDate(startOfTrendWindow.getDate() - 6);

    const [open, inProgress, waitingCustomer, closed, criticalCount, unassignedCount, resolvedTodayCount, recentRecords, criticalRecords, unassignedRecords, waitingCustomerRecords, technicians, trendRecords, slaRecords, myAssignedRecords] = await Promise.all([
      prisma.ticket.count({ where: { status: "OPEN" } }),
      prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { status: "WAITING_CUSTOMER" } }),
      prisma.ticket.count({ where: { status: "CLOSED" } }),
      prisma.ticket.count({ where: { priority: "CRITICAL" } }),
      prisma.ticket.count({ where: { assigneeId: null } }),
      prisma.ticket.count({
        where: {
          OR: [{ status: "RESOLVED" }, { status: "CLOSED" }],
          updatedAt: { gte: startOfToday }
        }
      }),
      prisma.ticket.findMany({
        include: ticketInclude,
        orderBy: [{ updatedAt: "desc" }],
        take: 5
      }),
      prisma.ticket.findMany({
        include: ticketInclude,
        where: { priority: "CRITICAL" },
        orderBy: [{ updatedAt: "desc" }],
        take: 5
      }),
      prisma.ticket.findMany({
        include: ticketInclude,
        where: { assigneeId: null },
        orderBy: [{ createdAt: "asc" }],
        take: 5
      }),
      prisma.ticket.findMany({
        include: ticketInclude,
        where: { status: "WAITING_CUSTOMER" },
        orderBy: [{ updatedAt: "desc" }],
        take: 5
      }),
      prisma.user.findMany({
        where: { active: true, role: { in: ["ATTENDANT", "TECHNICIAN"] } },
        include: {
          _count: {
            select: {
              assigned: true
            }
          }
        },
        orderBy: [{ assigned: { _count: "desc" } }, { name: "asc" }]
      }),
      prisma.ticket.findMany({
        select: {
          createdAt: true,
          updatedAt: true,
          status: true
        },
        where: {
          OR: [{ createdAt: { gte: startOfTrendWindow } }, { updatedAt: { gte: startOfTrendWindow } }]
        }
      }),
      prisma.ticket.findMany({
        include: ticketInclude,
        where: {
          status: {
            in: ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"]
          }
        }
      }),
      currentUserId
        ? prisma.ticket.findMany({
            include: ticketInclude,
            where: {
              assigneeId: currentUserId
            },
            orderBy: [{ updatedAt: "desc" }]
          })
        : Promise.resolve([])
    ]);
    const trend = buildTrend(trendRecords);
    const mappedSlaRecords = slaRecords.map(mapTicket);
    const slaAlerts = mappedSlaRecords
      .map((ticket) => ({ ticket, sla: getSlaInfo(ticket) }))
      .filter((item) => item.sla.state === "breached" || item.sla.state === "warning")
      .sort((left, right) => left.sla.remainingMs - right.sla.remainingMs);

    return {
      summary: {
        open,
        inProgress,
        waitingCustomer,
        closed
      },
      myAssignedTickets: myAssignedRecords.map(mapTicket),
      myAssignedCount: myAssignedRecords.length,
      myActiveAssignedCount: myAssignedRecords.filter((ticket) =>
        ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"].includes(ticket.status)
      ).length,
      recentTickets: recentRecords.map(mapTicket),
      criticalCount,
      unassignedCount,
      resolvedTodayCount,
      criticalTickets: criticalRecords.map(mapTicket),
      unassignedTickets: unassignedRecords.map(mapTicket),
      waitingCustomerTickets: waitingCustomerRecords.map(mapTicket),
      workload: technicians.map((user) => ({
        name: user.name,
        total: user._count.assigned
      })),
      trend,
      openedLast7Days: trend.reduce((total, item) => total + item.opened, 0),
      resolvedLast7Days: trend.reduce((total, item) => total + item.resolved, 0),
      slaBreachedCount: slaAlerts.filter((item) => item.sla.state === "breached").length,
      slaWarningCount: slaAlerts.filter((item) => item.sla.state === "warning").length,
      slaBreachedTickets: slaAlerts.filter((item) => item.sla.state === "breached").map((item) => item.ticket).slice(0, 5),
      slaWarningTickets: slaAlerts.filter((item) => item.sla.state === "warning").map((item) => item.ticket).slice(0, 5)
    };
  }
};
