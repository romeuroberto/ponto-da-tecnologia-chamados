import { getSlaInfo } from "@/lib/sla";
import { prisma } from "@/lib/db/prisma";
import { expenseService } from "@/server/services/expense-service";
import { saleService } from "@/server/services/sale-service";
import { ticketService } from "@/server/services/ticket-service";
import type { ExpenseCategory, FinancialStatus, Sale, Ticket, TicketPriority, TicketStatus } from "@/types";

const statusLabels: Record<TicketStatus, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em atendimento",
  WAITING_CUSTOMER: "Aguardando cliente",
  WAITING_PARTS: "Aguardando peças",
  CLOSED: "Encerrado",
  CANCELED: "Cancelado"
};

const priorityLabels: Record<TicketPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica"
};

const receivableTypeLabels = {
  ticket: "Chamados",
  sale: "Vendas",
  monthly: "Mensalidades",
  rental: "Locações"
} as const;

const financialStatusLabels: Record<FinancialStatus, string> = {
  PENDENTE: "Pendente",
  EM_ANALISE: "Pendente de cobrança",
  APROVADO: "Pendente de cobrança",
  FATURADO: "Faturado",
  PAGO: "Pago",
  CANCELADO: "Cancelado"
};

const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  ALUGUEL: "Aluguel",
  ENERGIA: "Energia",
  INTERNET: "Internet",
  TRANSPORTE: "Transporte",
  COMBUSTIVEL: "Combustível",
  ALIMENTACAO: "Alimentação",
  PECAS_INSUMOS: "Peças e insumos",
  FERRAMENTAS_EQUIPAMENTOS: "Ferramentas e equipamentos",
  IMPOSTOS_TAXAS: "Impostos e taxas",
  SERVICOS_TERCEIROS: "Serviços de terceiros",
  OUTROS: "Outros"
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

  if (ticket.status === "CLOSED") {
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

type ReceivableType = keyof typeof receivableTypeLabels;

interface FinancialReceivable {
  id: string;
  type: ReceivableType;
  number: string;
  title: string;
  clientId: string;
  clientName: string;
  status: FinancialStatus;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  createdAt: string;
  invoicedAt?: string;
  paidAt?: string;
}

function isInRange(dateValue: string | undefined, from?: string, to?: string) {
  if (!dateValue) return false;
  const { fromDate, toDate } = buildRange(from, to);
  const date = new Date(dateValue);
  if (fromDate && date < fromDate) return false;
  if (toDate && date > toDate) return false;
  return true;
}

function filterByCreatedAt<T extends { createdAt: string }>(items: T[], from?: string, to?: string) {
  return items.filter((item) => isInRange(item.createdAt, from, to));
}

function buildTicketReceivables(tickets: Ticket[]): FinancialReceivable[] {
  return tickets
    .filter((ticket) => ticket.billing)
    .map((ticket) => ({
      id: ticket.billing!.id,
      type: "ticket",
      number: ticket.number,
      title: ticket.title,
      clientId: ticket.clientId,
      clientName: ticket.clientName,
      status: ticket.billing!.financialStatus,
      subtotalAmount: ticket.billing!.subtotalAmount,
      discountAmount: ticket.billing!.discountAmount,
      totalAmount: ticket.billing!.totalAmount,
      createdAt: ticket.createdAt,
      invoicedAt: ticket.billing!.invoicedAt,
      paidAt: ticket.billing!.paidAt
    }));
}

function buildSaleReceivables(sales: Sale[]): FinancialReceivable[] {
  return sales.map((sale) => ({
    id: sale.id,
    type: "sale",
    number: sale.number,
    title: `${sale.items.length} item(s)`,
    clientId: sale.clientId,
    clientName: sale.clientName,
    status: sale.financialStatus,
    subtotalAmount: sale.totalAmount,
    discountAmount: 0,
    totalAmount: sale.totalAmount,
    createdAt: sale.createdAt,
    paidAt: sale.paidAt
  }));
}

async function listRecurringReceivables(): Promise<FinancialReceivable[]> {
  const [monthlyBillings, rentalBillings] = await Promise.all([
    prisma.contractMonthlyBilling.findMany({
      include: {
        client: { select: { name: true } },
        contract: { select: { contractNumber: true } }
      }
    }),
    prisma.rentalBilling.findMany({
      include: {
        client: { select: { name: true } },
        rentalContract: { select: { contractNumber: true } }
      }
    })
  ]);

  return [
    ...monthlyBillings.map((billing) => ({
      id: billing.id,
      type: "monthly" as const,
      number: `${String(billing.referenceMonth).padStart(2, "0")}/${billing.referenceYear}`,
      title: `Contrato ${billing.contract.contractNumber}`,
      clientId: billing.clientId,
      clientName: billing.client.name,
      status: billing.financialStatus,
      subtotalAmount: billing.amount.toNumber(),
      discountAmount: 0,
      totalAmount: billing.amount.toNumber(),
      createdAt: billing.createdAt.toISOString(),
      paidAt: billing.paidAt?.toISOString()
    })),
    ...rentalBillings.map((billing) => ({
      id: billing.id,
      type: "rental" as const,
      number: `${String(billing.referenceMonth).padStart(2, "0")}/${billing.referenceYear}`,
      title: `Contrato ${billing.rentalContract.contractNumber}`,
      clientId: billing.clientId,
      clientName: billing.client.name,
      status: billing.financialStatus,
      subtotalAmount: billing.amount.toNumber(),
      discountAmount: 0,
      totalAmount: billing.amount.toNumber(),
      createdAt: billing.createdAt.toISOString(),
      paidAt: billing.paidAt?.toISOString()
    }))
  ];
}

function buildReceivableTrend(receivables: FinancialReceivable[]) {
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

  const createdMap = new Map(days.map((day) => [day.key, 0]));
  const paidMap = new Map(days.map((day) => [day.key, 0]));

  receivables.forEach((receivable) => {
    const createdKey = formatDayKey(new Date(receivable.invoicedAt ?? receivable.createdAt));
    if (createdMap.has(createdKey)) {
      createdMap.set(createdKey, (createdMap.get(createdKey) ?? 0) + 1);
    }

    if (receivable.paidAt) {
      const paidKey = formatDayKey(new Date(receivable.paidAt));
      if (paidMap.has(paidKey)) {
        paidMap.set(paidKey, (paidMap.get(paidKey) ?? 0) + 1);
      }
    }
  });

  return days.map((day) => ({
    label: day.label,
    invoiced: createdMap.get(day.key) ?? 0,
    paid: paidMap.get(day.key) ?? 0
  }));
}

export const reportService = {
  async getOperationalReport(filters: { from?: string; to?: string }) {
    const allTickets = await ticketService.listTickets();
    const tickets = filterTicketsByRange(allTickets, filters.from, filters.to);
    const total = tickets.length;
    const active = tickets.filter((ticket) => ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "WAITING_PARTS"].includes(ticket.status)).length;
    const completed = tickets.filter((ticket) => ticket.status === "CLOSED").length;
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
        if (["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "WAITING_PARTS"].includes(ticket.status)) {
          current.active += 1;
        }
        if (ticket.status === "CLOSED") {
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
        if (["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "WAITING_PARTS"].includes(ticket.status)) {
          current.active += 1;
        }
        if (ticket.status === "CLOSED") {
          current.completed += 1;
        }

        map.set(key, current);
        return map;
      }, new Map<string, { assigneeId?: string; assigneeName: string; total: number; active: number; completed: number }>()),
      ([, value]) => value
    ).sort((left, right) => right.total - left.total || left.assigneeName.localeCompare(right.assigneeName));

    const [allSales, recurringReceivables] = await Promise.all([
      saleService.listSales(),
      listRecurringReceivables()
    ]);
    const trend = buildTrend(tickets);
    const billedTickets = tickets.filter((ticket) => ticket.billing);
    const receivables = [
      ...buildTicketReceivables(tickets),
      ...filterByCreatedAt(buildSaleReceivables(allSales), filters.from, filters.to),
      ...filterByCreatedAt(recurringReceivables, filters.from, filters.to)
    ];
    const financialSubtotal = receivables.reduce((sum, receivable) => sum + receivable.subtotalAmount, 0);
    const financialDiscount = receivables.reduce((sum, receivable) => sum + receivable.discountAmount, 0);
    const financialTotal = receivables.reduce((sum, receivable) => sum + receivable.totalAmount, 0);
    const pendingFinancialTotal = receivables
      .filter((receivable) => receivable.status !== "PAGO" && receivable.status !== "CANCELADO")
      .reduce((sum, receivable) => sum + receivable.totalAmount, 0);

    const byBillingType = (Object.keys(receivableTypeLabels) as ReceivableType[]).map((type) => ({
      type,
      label: receivableTypeLabels[type],
      total: receivables.filter((receivable) => receivable.type === type).length,
      amount: Number(
        receivables
          .filter((receivable) => receivable.type === type)
          .reduce((sum, receivable) => sum + receivable.totalAmount, 0)
          .toFixed(2)
      )
    }));

    const byFinancialStatus = (Object.keys(financialStatusLabels) as FinancialStatus[]).map((status) => ({
      status,
      label: financialStatusLabels[status],
      total: receivables.filter((receivable) => receivable.status === status).length,
      amount: Number(
        receivables
          .filter((receivable) => receivable.status === status)
          .reduce((sum, receivable) => sum + receivable.totalAmount, 0)
          .toFixed(2)
      )
    }));

    const pendingByClient = Array.from(
      receivables.reduce((map, receivable) => {
        if (receivable.status === "PAGO" || receivable.status === "CANCELADO") {
          return map;
        }

        const current = map.get(receivable.clientId) ?? {
          clientId: receivable.clientId,
          clientName: receivable.clientName,
          total: 0,
          count: 0
        };

        current.total += receivable.totalAmount;
        current.count += 1;
        map.set(receivable.clientId, current);
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
        totalReceivables: receivables.length,
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
    const [report, allTickets, filteredExpenses, allSales, allExpenses, recurringReceivables] = await Promise.all([
      reportService.getOperationalReport(filters),
      ticketService.listTickets(),
      expenseService.listExpenses({ from: filters.from, to: filters.to }),
      saleService.listSales(),
      expenseService.listExpenses(),
      listRecurringReceivables()
    ]);
    const tickets = filterTicketsByRange(allTickets, filters.from, filters.to);
    const billedTickets = tickets.filter((ticket) => ticket.billing);
    const periodReceivables = [
      ...buildTicketReceivables(tickets),
      ...filterByCreatedAt(buildSaleReceivables(allSales), filters.from, filters.to),
      ...filterByCreatedAt(recurringReceivables, filters.from, filters.to)
    ];
    const cashReceivables = [
      ...buildTicketReceivables(allTickets),
      ...buildSaleReceivables(allSales),
      ...recurringReceivables
    ];
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
      periodReceivables
        .filter((receivable) => receivable.status === "PAGO")
        .reduce((sum, receivable) => sum + receivable.totalAmount, 0)
        .toFixed(2)
    );
    const invoicedOpenTotal = Number(
      periodReceivables
        .filter((receivable) => receivable.status === "FATURADO")
        .reduce((sum, receivable) => sum + receivable.totalAmount, 0)
        .toFixed(2)
    );
    const averageTicketValue =
      report.financial.totalReceivables > 0
        ? Number((report.financial.total / report.financial.totalReceivables).toFixed(2))
        : 0;
    const { fromDate, toDate } = buildRange(filters.from, filters.to);
    const receivablesPaidAmount = Number(
      cashReceivables
        .filter((receivable) => receivable.status === "PAGO" && receivable.paidAt)
        .filter((receivable) => {
          const paidAt = receivable.paidAt ? new Date(receivable.paidAt) : null;
          if (!paidAt) return false;
          if (fromDate && paidAt < fromDate) return false;
          if (toDate && paidAt > toDate) return false;
          return true;
        })
        .reduce((sum, receivable) => sum + receivable.totalAmount, 0)
        .toFixed(2)
    );
    const expensesPaidAmount = Number(
      allExpenses
        .filter((expense) => expense.status === "PAGA" && expense.paidAt)
        .filter((expense) => {
          const paidAt = expense.paidAt ? new Date(expense.paidAt) : null;
          if (!paidAt) return false;
          if (fromDate && paidAt < fromDate) return false;
          if (toDate && paidAt > toDate) return false;
          return true;
        })
        .reduce((sum, expense) => sum + expense.amount, 0)
        .toFixed(2)
    );
    const expensesPendingAmount = Number(
      filteredExpenses
        .filter((expense) => expense.status === "PENDENTE")
        .reduce((sum, expense) => sum + expense.amount, 0)
        .toFixed(2)
    );
    const byExpenseCategory = Array.from(
      filteredExpenses.reduce((map, expense) => {
        if (expense.status === "CANCELADA") {
          return map;
        }

        const current = map.get(expense.category) ?? {
          category: expense.category,
          label: expenseCategoryLabels[expense.category],
          total: 0,
          amount: 0
        };

        current.total += 1;
        current.amount += expense.amount;
        map.set(expense.category, current);
        return map;
      }, new Map<ExpenseCategory, { category: ExpenseCategory; label: string; total: number; amount: number }>()),
      ([, value]) => ({
        ...value,
        amount: Number(value.amount.toFixed(2))
      })
    ).sort((left, right) => right.amount - left.amount);
    const cashInflow = receivablesPaidAmount;
    const cashOutflow = expensesPaidAmount;
    const cashBalance = Number((cashInflow - cashOutflow).toFixed(2));

    return {
      filters,
      summary: {
        totalTicketsWithBilling: report.financial.totalTicketsWithBilling,
        totalReceivables: report.financial.totalReceivables,
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
      trend: buildReceivableTrend(cashReceivables),
      recentActivity,
      expenses: {
        totalCount: filteredExpenses.length,
        pendingAmount: expensesPendingAmount,
        paidAmount: expensesPaidAmount,
        byCategory: byExpenseCategory
      },
      cash: {
        inflowAmount: cashInflow,
        outflowAmount: cashOutflow,
        balanceAmount: cashBalance
      }
    };
  },
  async getOperationalExport(filters: { from?: string; to?: string }) {
    const allTickets = await ticketService.listTickets();
    const tickets = filterTicketsByRange(allTickets, filters.from, filters.to);

    return tickets.map((ticket) => ({
      totalDespesasVinculadas: String((ticket.expenses ?? []).length),
      custoInternoVinculado: (ticket.expenses ?? [])
        .filter((expense) => expense.status !== "CANCELADA")
        .reduce((sum, expense) => sum + expense.amount, 0)
        .toFixed(2),
      numero: ticket.number,
      titulo: ticket.title,
      cliente: ticket.clientName,
      categoria: ticket.category ?? "",
      prioridade: priorityLabels[ticket.priority],
      status: statusLabels[ticket.status],
      sla: getSlaInfo(ticket).state,
      solicitante: ticket.requesterName,
      emailSolicitante: ticket.requesterEmail ?? "",
      responsável: ticket.assigneeName ?? "Não atribuído",
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
    const [allTickets, allSales, recurringReceivables] = await Promise.all([
      ticketService.listTickets(),
      saleService.listSales(),
      listRecurringReceivables()
    ]);
    const receivables = [
      ...buildTicketReceivables(filterTicketsByRange(allTickets, filters.from, filters.to)),
      ...filterByCreatedAt(buildSaleReceivables(allSales), filters.from, filters.to),
      ...filterByCreatedAt(recurringReceivables, filters.from, filters.to)
    ];

    return receivables.map((receivable) => ({
      tipoRecebivel: receivableTypeLabels[receivable.type],
      numero: receivable.number,
      titulo: receivable.title,
      cliente: receivable.clientName,
      statusFinanceiro: financialStatusLabels[receivable.status],
      subtotal: receivable.subtotalAmount.toFixed(2),
      desconto: receivable.discountAmount.toFixed(2),
      total: receivable.totalAmount.toFixed(2),
      criadoEm: formatDateTime(receivable.createdAt),
      faturadoEm: formatDateTime(receivable.invoicedAt),
      pagoEm: formatDateTime(receivable.paidAt)
    }));
  },
  async getCashExpensesExport(filters: { from?: string; to?: string }) {
    const dashboard = await reportService.getFinancialDashboard(filters);
    const expenses = await expenseService.listExpenses({
      from: filters.from,
      to: filters.to,
      sort: "expense_desc"
    });

    const summaryRows = [
      {
        tipoLinha: "RESUMO_CAIXA",
        periodoDe: filters.from ?? "",
        periodoAte: filters.to ?? "",
        entradasRealizadas: dashboard.cash.inflowAmount.toFixed(2),
        saidasRealizadas: dashboard.cash.outflowAmount.toFixed(2),
        saldoPeriodo: dashboard.cash.balanceAmount.toFixed(2),
        despesasPendentes: dashboard.expenses.pendingAmount.toFixed(2),
        descricao: "",
        categoria: "",
        statusDespesa: "",
        valorDespesa: "",
        dataDespesa: "",
        dataPagamento: "",
        chamado: "",
        lancadoPor: "",
        observacoes: ""
      }
    ];

    const expenseRows = expenses.map((expense) => ({
      tipoLinha: "DESPESA",
      periodoDe: filters.from ?? "",
      periodoAte: filters.to ?? "",
      entradasRealizadas: "",
      saidasRealizadas: "",
      saldoPeriodo: "",
      despesasPendentes: "",
      descricao: expense.description,
      categoria: expenseCategoryLabels[expense.category],
      statusDespesa:
        expense.status === "PENDENTE" ? "Pendente" : expense.status === "PAGA" ? "Paga" : "Cancelada",
      valorDespesa: expense.amount.toFixed(2),
      dataDespesa: formatDateTime(expense.expenseDate),
      dataPagamento: formatDateTime(expense.paidAt),
      chamado: expense.ticketNumber ? `${expense.ticketNumber} - ${expense.ticketTitle ?? ""}` : "",
      lancadoPor: expense.createdByName,
      observacoes: expense.notes ?? ""
    }));

    return [...summaryRows, ...expenseRows];
  }
};
