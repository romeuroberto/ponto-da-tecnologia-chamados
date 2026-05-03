import { getSlaInfo } from "@/lib/sla";
import { ticketService } from "@/server/services/ticket-service";
import type { BillingType, FinancialStatus, Ticket, TicketPriority, TicketStatus } from "@/types";

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
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica"
};

const billingTypeLabels: Record<BillingType, string> = {
  AVULSO: "Avulso",
  CONTRATO: "Contrato",
  GARANTIA: "Garantia",
  CORTESIA: "Cortesia"
};

const financialStatusLabels: Record<FinancialStatus, string> = {
  PENDENTE: "Pendente",
  EM_ANALISE: "Em análise",
  APROVADO: "Aprovado",
  FATURADO: "Faturado",
  PAGO: "Pago",
  CANCELADO: "Cancelado"
};

function formatDateTime(value?: string) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

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

function buildFinancialTrend(tickets: Ticket[]) {
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

  const invoicedMap = new Map(days.map((day) => [day.key, 0]));
  const paidMap = new Map(days.map((day) => [day.key, 0]));

  tickets.forEach((ticket) => {
    if (ticket.billing?.invoicedAt) {
      const invoicedKey = formatDayKey(new Date(ticket.billing.invoicedAt));
      if (invoicedMap.has(invoicedKey)) {
        invoicedMap.set(invoicedKey, (invoicedMap.get(invoicedKey) ?? 0) + 1);
      }
    }

    if (ticket.billing?.paidAt) {
      const paidKey = formatDayKey(new Date(ticket.billing.paidAt));
      if (paidMap.has(paidKey)) {
        paidMap.set(paidKey, (paidMap.get(paidKey) ?? 0) + 1);
      }
    }
  });

  return days.map((day) => ({
    label: day.label,
    invoiced: invoicedMap.get(day.key) ?? 0,
    paid: paidMap.get(day.key) ?? 0
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
          assigneeName: ticket.assigneeName ?? "Não atribuído",
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
    const billedTickets = tickets.filter((ticket) => ticket.billing);
    const financialSubtotal = billedTickets.reduce((sum, ticket) => sum + (ticket.billing?.subtotalAmount ?? 0), 0);
    const financialDiscount = billedTickets.reduce((sum, ticket) => sum + (ticket.billing?.discountAmount ?? 0), 0);
    const financialTotal = billedTickets.reduce((sum, ticket) => sum + (ticket.billing?.totalAmount ?? 0), 0);
    const pendingFinancialTotal = billedTickets
      .filter((ticket) => ticket.billing && ticket.billing.financialStatus !== "PAGO" && ticket.billing.financialStatus !== "CANCELADO")
      .reduce((sum, ticket) => sum + (ticket.billing?.totalAmount ?? 0), 0);

    const byBillingType = (Object.keys(billingTypeLabels) as BillingType[]).map((type) => ({
      type,
      label: billingTypeLabels[type],
      total: billedTickets.filter((ticket) => ticket.billing?.billingType === type).length,
      amount: Number(
        billedTickets
          .filter((ticket) => ticket.billing?.billingType === type)
          .reduce((sum, ticket) => sum + (ticket.billing?.totalAmount ?? 0), 0)
          .toFixed(2)
      )
    }));

    const byFinancialStatus = (Object.keys(financialStatusLabels) as FinancialStatus[]).map((status) => ({
      status,
      label: financialStatusLabels[status],
      total: billedTickets.filter((ticket) => ticket.billing?.financialStatus === status).length,
      amount: Number(
        billedTickets
          .filter((ticket) => ticket.billing?.financialStatus === status)
          .reduce((sum, ticket) => sum + (ticket.billing?.totalAmount ?? 0), 0)
          .toFixed(2)
      )
    }));

    const pendingByClient = Array.from(
      billedTickets.reduce((map, ticket) => {
        if (!ticket.billing || ticket.billing.financialStatus === "PAGO" || ticket.billing.financialStatus === "CANCELADO") {
          return map;
        }

        const current = map.get(ticket.clientId) ?? {
          clientId: ticket.clientId,
          clientName: ticket.clientName,
          total: 0,
          count: 0
        };

        current.total += ticket.billing.totalAmount;
        current.count += 1;
        map.set(ticket.clientId, current);
        return map;
      }, new Map<string, { clientId: string; clientName: string; total: number; count: number }>()),
      ([, value]) => value
    ).sort((left, right) => right.total - left.total || left.clientName.localeCompare(right.clientName));

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
      trend,
      financial: {
        totalTicketsWithBilling: billedTickets.length,
        subtotal: Number(financialSubtotal.toFixed(2)),
        discount: Number(financialDiscount.toFixed(2)),
        total: Number(financialTotal.toFixed(2)),
        pendingTotal: Number(pendingFinancialTotal.toFixed(2)),
        byBillingType,
        byFinancialStatus,
        pendingByClient
      }
    };
  },
  async getFinancialDashboard(filters: { from?: string; to?: string }) {
    const report = await reportService.getOperationalReport(filters);
    const allTickets = await ticketService.listTickets();
    const tickets = filterTicketsByRange(allTickets, filters.from, filters.to);
    const billedTickets = tickets.filter((ticket) => ticket.billing);
    const recentActivity = billedTickets
      .flatMap((ticket) =>
        (ticket.billing?.history ?? []).map((item) => ({
          id: item.id,
          ticketId: ticket.id,
          ticketNumber: ticket.number,
          ticketTitle: ticket.title,
          clientName: ticket.clientName,
          authorName: item.authorName,
          message: item.message,
          createdAt: item.createdAt
        }))
      )
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
      .slice(0, 10);

    const paidCount = report.financial.byFinancialStatus.find((item) => item.status === "PAGO")?.total ?? 0;
    const invoicedCount = report.financial.byFinancialStatus.find((item) => item.status === "FATURADO")?.total ?? 0;
    const approvedCount = report.financial.byFinancialStatus.find((item) => item.status === "APROVADO")?.total ?? 0;
    const pendingCount =
      (report.financial.byFinancialStatus.find((item) => item.status === "PENDENTE")?.total ?? 0) +
      (report.financial.byFinancialStatus.find((item) => item.status === "EM_ANALISE")?.total ?? 0) +
      approvedCount;
    const paidTotal = Number(
      billedTickets
        .filter((ticket) => ticket.billing?.financialStatus === "PAGO")
        .reduce((sum, ticket) => sum + (ticket.billing?.totalAmount ?? 0), 0)
        .toFixed(2)
    );
    const invoicedOpenTotal = Number(
      billedTickets
        .filter((ticket) => ticket.billing?.financialStatus === "FATURADO")
        .reduce((sum, ticket) => sum + (ticket.billing?.totalAmount ?? 0), 0)
        .toFixed(2)
    );
    const averageTicketValue =
      report.financial.totalTicketsWithBilling > 0
        ? Number((report.financial.total / report.financial.totalTicketsWithBilling).toFixed(2))
        : 0;

    return {
      filters,
      summary: {
        totalTicketsWithBilling: report.financial.totalTicketsWithBilling,
        totalAmount: report.financial.total,
        pendingAmount: report.financial.pendingTotal,
        paidAmount: paidTotal,
        invoicedOpenAmount: invoicedOpenTotal,
        subtotalAmount: report.financial.subtotal,
        discountAmount: report.financial.discount,
        paidCount,
        invoicedCount,
        approvedCount,
        pendingCount,
        averageTicketValue
      },
      byBillingType: report.financial.byBillingType,
      byFinancialStatus: report.financial.byFinancialStatus,
      pendingByClient: report.financial.pendingByClient,
      trend: buildFinancialTrend(billedTickets),
      recentActivity
    };
  },
  async getOperationalExport(filters: { from?: string; to?: string }) {
    const allTickets = await ticketService.listTickets();
    const tickets = filterTicketsByRange(allTickets, filters.from, filters.to);

    return tickets.map((ticket) => ({
      numero: ticket.number,
      titulo: ticket.title,
      cliente: ticket.clientName,
      categoria: ticket.category ?? "",
      prioridade: priorityLabels[ticket.priority],
      status: statusLabels[ticket.status],
      sla: getSlaInfo(ticket).state,
      solicitante: ticket.requesterName,
      emailSolicitante: ticket.requesterEmail ?? "",
      responsavel: ticket.assigneeName ?? "Não atribuído",
      abertoPor: ticket.openedByName,
      criadoEm: formatDateTime(ticket.createdAt),
      atualizadoEm: formatDateTime(ticket.updatedAt),
      resolvidoEm: formatDateTime(ticket.resolvedAt),
      encerradoEm: formatDateTime(ticket.closedAt),
      motivoEncerramento: ticket.closingReason ?? "",
      totalAnexos: String(ticket.attachments.length),
      totalInteracoes: String(ticket.history.length)
    }));
  },
  async getFinancialExport(filters: { from?: string; to?: string }) {
    const allTickets = await ticketService.listTickets();
    const tickets = filterTicketsByRange(allTickets, filters.from, filters.to).filter((ticket) => ticket.billing);

    return tickets.map((ticket) => ({
      numero: ticket.number,
      titulo: ticket.title,
      cliente: ticket.clientName,
      categoria: ticket.category ?? "",
      statusChamado: statusLabels[ticket.status],
      responsavel: ticket.assigneeName ?? "Não atribuído",
      tipoCobranca: billingTypeLabels[ticket.billing?.billingType ?? "AVULSO"],
      statusFinanceiro: financialStatusLabels[ticket.billing?.financialStatus ?? "PENDENTE"],
      subtotal: (ticket.billing?.subtotalAmount ?? 0).toFixed(2),
      desconto: (ticket.billing?.discountAmount ?? 0).toFixed(2),
      total: (ticket.billing?.totalAmount ?? 0).toFixed(2),
      totalLancamentos: String(ticket.billing?.entries.length ?? 0),
      aprovadoEm: formatDateTime(ticket.billing?.approvedAt),
      faturadoEm: formatDateTime(ticket.billing?.invoicedAt),
      pagoEm: formatDateTime(ticket.billing?.paidAt),
      criadoEm: formatDateTime(ticket.createdAt),
      atualizadoEm: formatDateTime(ticket.updatedAt)
    }));
  }
};
