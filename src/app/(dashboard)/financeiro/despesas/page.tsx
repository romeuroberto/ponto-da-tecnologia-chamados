import type { Route } from "next";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { FormMessage } from "@/components/forms/form-message";
import { PageHeader } from "@/components/layout/page-header";
import { ActiveFilters } from "@/components/ui/active-filters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ResultsSummary } from "@/components/ui/results-summary";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import { PAYMENT_METHODS } from "@/lib/billing-rules";
import { formatCurrency } from "@/lib/utils";
import { expenseCancelSchema, expensePaySchema, expenseSchema, recurringExpenseSchema } from "@/lib/validations/expense";
import { requireRole } from "@/server/auth/session";
import { expenseService } from "@/server/services/expense-service";
import { recurringExpenseRepository } from "@/server/repositories/recurring-expense-repository";
import { ticketService } from "@/server/services/ticket-service";
import type { ExpenseCategory, ExpenseStatus, RecurringFrequency } from "@/types";

type ExpenseSort = "expense_desc" | "expense_asc" | "amount_desc" | "amount_asc" | "created_desc" | "created_asc";

const categoryLabels: Record<ExpenseCategory, string> = {
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

const statusLabels: Record<ExpenseStatus, string> = {
  PENDENTE: "Pendente",
  PAGA: "Paga",
  CANCELADA: "Cancelada"
};

const statusColors: Record<ExpenseStatus, string> = {
  PENDENTE: "bg-amber-100 text-amber-700",
  PAGA: "bg-emerald-100 text-emerald-700",
  CANCELADA: "bg-slate-200 text-slate-500"
};

const frequencyLabels: Record<RecurringFrequency, string> = {
  MENSAL: "Mensal",
  BIMESTRAL: "Bimestral",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual"
};

function getMessage(status?: string, message?: string) {
  if (!status || !message) return null;
  return <FormMessage type={status === "success" ? "success" : "error"} message={message} />;
}

function toDateInput(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function toRedirectMessage(base: string, status: "success" | "error", message: string) {
  return `${base}?status=${status}&message=${encodeURIComponent(message)}` as Route;
}

export default async function ExpensesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(["ADMIN", "ATTENDANT"]);

  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : undefined;
  const message = typeof params.message === "string" ? params.message : undefined;
  const from = typeof params.from === "string" ? params.from : undefined;
  const to = typeof params.to === "string" ? params.to : undefined;
  const query = typeof params.query === "string" ? params.query : undefined;
  const category = typeof params.category === "string" ? (params.category as ExpenseCategory) : undefined;
  const expenseStatus = typeof params.expenseStatus === "string" ? (params.expenseStatus as ExpenseStatus) : undefined;
  const sort: ExpenseSort = typeof params.sort === "string" ? (params.sort as ExpenseSort) : "expense_desc";
  const page = typeof params.page === "string" ? params.page : "1";
  const ticketId = typeof params.ticketId === "string" ? params.ticketId : undefined;
  const exportParams = new URLSearchParams();

  if (from) exportParams.set("from", from);
  if (to) exportParams.set("to", to);

  await recurringExpenseRepository.generateOccurrences();

  const [result, summary, recurringExpenses, preSelectedTicket, recentTickets] = await Promise.all([
    expenseService.searchExpenses({ from, to, query, category, status: expenseStatus, sort, page }),
    expenseService.getSummary({ from, to, query, category, status: expenseStatus }),
    recurringExpenseRepository.listAll(),
    ticketId ? ticketService.getTicket(ticketId) : Promise.resolve(null),
    ticketService.searchTickets({ sort: "updated_desc", pageSize: 80 })
  ]);

  const cashExpensesExportHref = `/api/reports/cash-expenses${exportParams.toString() ? `?${exportParams.toString()}` : ""}`;
  const activeFilters = [
    query ? { label: "Busca", value: query } : null,
    expenseStatus ? { label: "Status", value: statusLabels[expenseStatus] } : null,
    category ? { label: "Categoria", value: categoryLabels[category] } : null,
    from ? { label: "De", value: from } : null,
    to ? { label: "Até", value: to } : null
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  async function createExpense(formData: FormData) {
    "use server";
    const user = await requireRole(["ADMIN", "ATTENDANT"]);

    const parsed = expenseSchema.safeParse({
      description: formData.get("description")?.toString() ?? "",
      category: formData.get("category")?.toString() ?? "",
      amount: formData.get("amount")?.toString() ?? "",
      expenseDate: formData.get("expenseDate")?.toString() ?? "",
      paymentMethod: formData.get("paymentMethod")?.toString() ?? "",
      notes: formData.get("notes")?.toString() ?? "",
      ticketId: formData.get("ticketId")?.toString() ?? ""
    });

    if (!parsed.success) {
      redirect(toRedirectMessage("/financeiro/despesas", "error", "Confira os dados da nova despesa."));
    }

    let destination: Route;
    try {
      await expenseService.createExpense({ ...parsed.data, ticketId: parsed.data.ticketId || undefined, createdById: user.id });
      revalidatePath("/financeiro");
      revalidatePath("/financeiro/despesas");
      destination = toRedirectMessage("/financeiro/despesas", "success", "Despesa criada com sucesso.");
    } catch (error) {
      destination = toRedirectMessage("/financeiro/despesas", "error", error instanceof Error ? error.message : "Falha ao criar despesa.");
    }
    redirect(destination);
  }

  async function updateExpense(formData: FormData) {
    "use server";
    const user = await requireRole(["ADMIN", "ATTENDANT"]);
    const id = formData.get("id")?.toString() ?? "";

    const parsed = expenseSchema.safeParse({
      description: formData.get("description")?.toString() ?? "",
      category: formData.get("category")?.toString() ?? "",
      amount: formData.get("amount")?.toString() ?? "",
      expenseDate: formData.get("expenseDate")?.toString() ?? "",
      paymentMethod: formData.get("paymentMethod")?.toString() ?? "",
      notes: formData.get("notes")?.toString() ?? "",
      ticketId: formData.get("ticketId")?.toString() ?? ""
    });

    if (!id || !parsed.success) {
      redirect(toRedirectMessage("/financeiro/despesas", "error", "Confira os dados da despesa."));
    }

    let destination: Route;
    try {
      await expenseService.updateExpense(id, { ...parsed.data, ticketId: parsed.data.ticketId || undefined }, user.id);
      revalidatePath("/financeiro");
      revalidatePath("/financeiro/despesas");
      destination = toRedirectMessage("/financeiro/despesas", "success", "Despesa atualizada.");
    } catch (error) {
      destination = toRedirectMessage("/financeiro/despesas", "error", error instanceof Error ? error.message : "Falha ao atualizar despesa.");
    }
    redirect(destination);
  }

  async function payExpense(formData: FormData) {
    "use server";
    const user = await requireRole(["ADMIN", "ATTENDANT"]);
    const id = formData.get("id")?.toString() ?? "";
    const parsed = expensePaySchema.safeParse({
      paidAt: formData.get("paidAt")?.toString() ?? "",
      paymentMethod: formData.get("paymentMethod")?.toString() ?? ""
    });

    if (!id || !parsed.success) {
      redirect(toRedirectMessage("/financeiro/despesas", "error", "Informe a data de pagamento da despesa."));
    }

    let destination: Route;
    try {
      await expenseService.payExpense(id, parsed.data, user.id);
      revalidatePath("/financeiro");
      revalidatePath("/financeiro/despesas");
      destination = toRedirectMessage("/financeiro/despesas", "success", "Despesa marcada como paga.");
    } catch (error) {
      destination = toRedirectMessage("/financeiro/despesas", "error", error instanceof Error ? error.message : "Falha ao pagar despesa.");
    }
    redirect(destination);
  }

  async function cancelExpense(formData: FormData) {
    "use server";
    const user = await requireRole(["ADMIN", "ATTENDANT"]);
    const id = formData.get("id")?.toString() ?? "";
    const parsed = expenseCancelSchema.safeParse({
      cancellationReason: formData.get("cancellationReason")?.toString() ?? ""
    });

    if (!id || !parsed.success) {
      redirect(toRedirectMessage("/financeiro/despesas", "error", "Informe o motivo do cancelamento."));
    }

    let destination: Route;
    try {
      await expenseService.cancelExpense(id, parsed.data, user.id);
      revalidatePath("/financeiro");
      revalidatePath("/financeiro/despesas");
      destination = toRedirectMessage("/financeiro/despesas", "success", "Despesa cancelada.");
    } catch (error) {
      destination = toRedirectMessage("/financeiro/despesas", "error", error instanceof Error ? error.message : "Falha ao cancelar despesa.");
    }
    redirect(destination);
  }

  async function createRecurringExpense(formData: FormData) {
    "use server";
    const user = await requireRole(["ADMIN", "ATTENDANT"]);

    const parsed = recurringExpenseSchema.safeParse({
      description: formData.get("re_description")?.toString() ?? "",
      category: formData.get("re_category")?.toString() ?? "",
      baseAmount: formData.get("re_baseAmount")?.toString() ?? "",
      paymentMethod: formData.get("re_paymentMethod")?.toString() ?? "",
      frequency: formData.get("re_frequency")?.toString() ?? "",
      dayOfMonth: formData.get("re_dayOfMonth")?.toString() ?? "1",
      startDate: formData.get("re_startDate")?.toString() ?? "",
      endDate: formData.get("re_endDate")?.toString() ?? "",
      notes: formData.get("re_notes")?.toString() ?? ""
    });

    if (!parsed.success) {
      redirect(toRedirectMessage("/financeiro/despesas", "error", "Confira os dados da despesa fixa."));
    }

    let destination: Route;
    try {
      await recurringExpenseRepository.create(parsed.data, user.id);
      revalidatePath("/financeiro/despesas");
      destination = toRedirectMessage("/financeiro/despesas", "success", "Despesa fixa criada com sucesso.");
    } catch (error) {
      destination = toRedirectMessage("/financeiro/despesas", "error", error instanceof Error ? error.message : "Falha ao criar despesa fixa.");
    }
    redirect(destination);
  }

  async function updateRecurringExpense(formData: FormData) {
    "use server";
    await requireRole(["ADMIN", "ATTENDANT"]);
    const id = formData.get("re_id")?.toString() ?? "";

    const parsed = recurringExpenseSchema.safeParse({
      description: formData.get("re_description")?.toString() ?? "",
      category: formData.get("re_category")?.toString() ?? "",
      baseAmount: formData.get("re_baseAmount")?.toString() ?? "",
      paymentMethod: formData.get("re_paymentMethod")?.toString() ?? "",
      frequency: formData.get("re_frequency")?.toString() ?? "",
      dayOfMonth: formData.get("re_dayOfMonth")?.toString() ?? "1",
      startDate: formData.get("re_startDate")?.toString() ?? "",
      endDate: formData.get("re_endDate")?.toString() ?? "",
      notes: formData.get("re_notes")?.toString() ?? ""
    });

    if (!id || !parsed.success) {
      redirect(toRedirectMessage("/financeiro/despesas", "error", "Confira os dados da despesa fixa."));
    }

    let destination: Route;
    try {
      await recurringExpenseRepository.update(id, parsed.data);
      revalidatePath("/financeiro/despesas");
      destination = toRedirectMessage("/financeiro/despesas", "success", "Despesa fixa atualizada.");
    } catch (error) {
      destination = toRedirectMessage("/financeiro/despesas", "error", error instanceof Error ? error.message : "Falha ao atualizar despesa fixa.");
    }
    redirect(destination);
  }

  async function toggleRecurringExpense(formData: FormData) {
    "use server";
    await requireRole(["ADMIN", "ATTENDANT"]);
    const id = formData.get("re_id")?.toString() ?? "";
    const active = formData.get("re_active")?.toString() === "true";

    if (!id) {
      redirect(toRedirectMessage("/financeiro/despesas", "error", "ID inválido."));
    }

    let destination: Route;
    try {
      await recurringExpenseRepository.setActive(id, active);
      revalidatePath("/financeiro/despesas");
      destination = toRedirectMessage("/financeiro/despesas", "success", active ? "Despesa fixa reativada." : "Despesa fixa pausada.");
    } catch (error) {
      destination = toRedirectMessage("/financeiro/despesas", "error", error instanceof Error ? error.message : "Falha ao atualizar despesa fixa.");
    }
    redirect(destination);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Despesas"
        description="Controle saídas operacionais e despesas fixas recorrentes."
        action={
          <a
            href={cashExpensesExportHref}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
          >
            Exportar caixa e despesas CSV
          </a>
        }
      />

      {getMessage(status, message)}

      {/* Resumo */}
      <section className="grid gap-4 md:grid-cols-4">
        <Card className="border-emerald-200 bg-emerald-50/60">
          <CardContent className="p-5">
            <p className="text-sm text-emerald-700">Saídas realizadas</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-950">{formatCurrency(summary.paidAmount)}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="p-5">
            <p className="text-sm text-amber-700">Pendentes</p>
            <p className="mt-2 text-2xl font-semibold text-amber-950">{formatCurrency(summary.pendingAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">Despesas no filtro</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{summary.totalCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">Aguardando pagamento</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{summary.pendingCount}</p>
          </CardContent>
        </Card>
      </section>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/financeiro/despesas" className="grid gap-4 lg:grid-cols-6">
            <Input name="query" placeholder="Buscar por descrição" defaultValue={query ?? ""} />
            <Input name="from" type="date" defaultValue={from ?? ""} />
            <Input name="to" type="date" defaultValue={to ?? ""} />
            <Select name="expenseStatus" defaultValue={expenseStatus ?? ""}>
              <option value="">Todos os status</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
            <Select name="category" defaultValue={category ?? ""}>
              <option value="">Todas as categorias</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
            <Select name="sort" defaultValue={sort}>
              <option value="expense_desc">Despesa mais recente</option>
              <option value="expense_asc">Despesa mais antiga</option>
              <option value="amount_desc">Maior valor</option>
              <option value="amount_asc">Menor valor</option>
              <option value="created_desc">Lançamento mais recente</option>
              <option value="created_asc">Lançamento mais antigo</option>
            </Select>
            <div className="flex flex-wrap gap-2 lg:col-span-6">
              <input type="hidden" name="page" value="1" />
              <Button type="submit">Aplicar filtros</Button>
              <a
                href="/financeiro/despesas?expenseStatus=PENDENTE"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100"
              >
                Ver apenas pendentes
              </a>
              <a
                href="/financeiro/despesas"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
              >
                Limpar filtros
              </a>
            </div>
          </form>
        </CardContent>
      </Card>

      <ActiveFilters pathname="/financeiro/despesas" filters={activeFilters} />
      <ResultsSummary label="despesas" total={result.total} page={result.page} totalPages={result.totalPages} />

      {/* Nova despesa — colapsável */}
      <details className="group">
        <summary className="cursor-pointer list-none">
          <div className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-400 hover:text-slate-800">
            <span className="text-lg leading-none">+</span>
            <span className="group-open:hidden">Nova despesa</span>
            <span className="hidden group-open:inline">Fechar formulário</span>
          </div>
        </summary>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Nova despesa</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createExpense} className="grid gap-4">
              <div className="grid gap-4 lg:grid-cols-3">
                <Input name="description" placeholder="Descrição" required />
                <Select name="category" defaultValue="OUTROS" required>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
                <CurrencyInput name="amount" placeholder="Valor" required />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Input name="expenseDate" type="date" required />
                <Select name="paymentMethod" defaultValue="">
                  <option value="">Forma de pagamento</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Select>
              </div>
              {preSelectedTicket ? (
                <div className="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">Chamado vinculado</p>
                    <p className="mt-0.5 truncate text-sm font-medium text-sky-950">
                      {preSelectedTicket.number} — {preSelectedTicket.title}
                    </p>
                  </div>
                  <input type="hidden" name="ticketId" value={preSelectedTicket.id} />
                </div>
              ) : (
                <Select name="ticketId" defaultValue="">
                  <option value="">Sem vínculo com chamado (opcional)</option>
                  {recentTickets.items.map((ticket) => (
                    <option key={ticket.id} value={ticket.id}>
                      {ticket.number} — {ticket.clientName} — {ticket.title}
                    </option>
                  ))}
                </Select>
              )}
              <Textarea name="notes" placeholder="Observações" />
              <div className="flex justify-end">
                <Button type="submit">Criar despesa</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </details>

      {/* Grid principal: lista + sidebar */}
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">

        {/* Lista de despesas */}
        <div className="space-y-3">
          {result.items.length > 0 ? (
            result.items.map((expense) => (
              <div
                key={expense.id}
                className={`overflow-hidden rounded-xl border bg-white ${expense.status === "PENDENTE" ? "border-amber-200" : "border-slate-200"}`}
              >
                {/* Linha de resumo */}
                <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900">{expense.description}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[expense.status]}`}>
                      {statusLabels[expense.status]}
                    </span>
                    {expense.recurringExpenseId ? (
                      <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">Fixa</span>
                    ) : null}
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {categoryLabels[expense.category]}
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-slate-950">{formatCurrency(expense.amount)}</p>
                    <p className="text-xs text-slate-500">{new Date(expense.expenseDate).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>

                {/* Ação de pagamento rápida — só para PENDENTE */}
                {expense.status === "PENDENTE" ? (
                  <form action={payExpense} className="flex flex-wrap items-center gap-2 border-t border-amber-100 bg-amber-50/50 px-4 py-3">
                    <input type="hidden" name="id" value={expense.id} />
                    <Input
                      name="paidAt"
                      type="date"
                      defaultValue={toDateInput(expense.paidAt ?? expense.expenseDate)}
                      className="max-w-44"
                    />
                    <Select name="paymentMethod" defaultValue={expense.paymentMethod ?? ""} className="max-w-48">
                      <option value="">Forma de pagamento</option>
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </Select>
                    <Button type="submit">Marcar como paga</Button>
                  </form>
                ) : null}

                {/* Edição e detalhes — colapsável */}
                <details className="group border-t border-slate-100">
                  <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800">
                    <span className="group-open:hidden">▸ {expense.status === "PENDENTE" ? "Editar / Cancelar" : "Ver detalhes"}</span>
                    <span className="hidden group-open:inline">▾ Fechar</span>
                  </summary>

                  <div className="space-y-4 px-4 pb-4 pt-2">
                    {/* Informações adicionais */}
                    <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 md:grid-cols-2">
                      <p><span className="font-semibold text-slate-900">Lançado por:</span> {expense.createdByName}</p>
                      {expense.paidAt ? (
                        <p><span className="font-semibold text-slate-900">Pago em:</span> {new Date(expense.paidAt).toLocaleDateString("pt-BR")}</p>
                      ) : null}
                      {expense.referenceMonth && expense.referenceYear ? (
                        <p><span className="font-semibold text-slate-900">Referência:</span> {String(expense.referenceMonth).padStart(2, "0")}/{expense.referenceYear}</p>
                      ) : null}
                      {expense.ticketId ? (
                        <p className="md:col-span-2">
                          <span className="font-semibold text-slate-900">Chamado: </span>
                          <a href={`/chamados/${expense.ticketId}`} className="font-medium text-sky-700 hover:underline">
                            {expense.ticketNumber} — {expense.ticketTitle}
                          </a>
                        </p>
                      ) : null}
                      {expense.cancellationReason ? (
                        <p className="md:col-span-2">
                          <span className="font-semibold text-slate-900">Motivo do cancelamento:</span> {expense.cancellationReason}
                        </p>
                      ) : null}
                    </div>

                    {/* Formulário de edição */}
                    <form action={updateExpense} className="grid gap-3">
                      <input type="hidden" name="id" value={expense.id} />
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Input
                          name="description"
                          defaultValue={expense.description}
                          disabled={expense.status === "CANCELADA" || expense.status === "PAGA"}
                          required
                        />
                        <Select
                          name="category"
                          defaultValue={expense.category}
                          disabled={expense.status === "CANCELADA" || expense.status === "PAGA"}
                        >
                          {Object.entries(categoryLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </Select>
                        <CurrencyInput
                          name="amount"
                          defaultValue={expense.amount}
                          disabled={expense.status === "CANCELADA" || expense.status === "PAGA"}
                          required
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          name="expenseDate"
                          type="date"
                          defaultValue={toDateInput(expense.expenseDate)}
                          disabled={expense.status === "CANCELADA" || expense.status === "PAGA"}
                          required
                        />
                        <Select
                          name="paymentMethod"
                          defaultValue={expense.paymentMethod ?? ""}
                          disabled={expense.status === "CANCELADA" || expense.status === "PAGA"}
                        >
                          <option value="">Forma de pagamento</option>
                          {PAYMENT_METHODS.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </Select>
                      </div>
                      <Select
                        name="ticketId"
                        defaultValue={expense.ticketId ?? ""}
                        disabled={expense.status === "CANCELADA" || expense.status === "PAGA"}
                      >
                        <option value="">Sem vínculo com chamado</option>
                        {recentTickets.items.map((ticket) => (
                          <option key={ticket.id} value={ticket.id}>
                            {ticket.number} — {ticket.clientName} — {ticket.title}
                          </option>
                        ))}
                      </Select>
                      <Textarea name="notes" defaultValue={expense.notes ?? ""} disabled={expense.status === "CANCELADA"} />
                      {expense.status !== "CANCELADA" ? (
                        <div className="flex justify-start">
                          <Button type="submit" variant="secondary" size="sm" disabled={expense.status === "PAGA" && !expense.notes}>
                            Salvar alterações
                          </Button>
                        </div>
                      ) : null}
                    </form>

                    {/* Cancelamento — só para PENDENTE */}
                    {expense.status === "PENDENTE" ? (
                      <form action={cancelExpense} className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
                        <input type="hidden" name="id" value={expense.id} />
                        <Input
                          name="cancellationReason"
                          placeholder="Motivo do cancelamento"
                          className="min-w-48 flex-1"
                        />
                        <Button type="submit" variant="outline" size="sm">Cancelar despesa</Button>
                      </form>
                    ) : null}
                  </div>
                </details>
              </div>
            ))
          ) : (
            <EmptyState
              title="Nenhuma despesa encontrada"
              description="Ajuste os filtros ou crie uma nova despesa."
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Por categoria */}
          <Card>
            <CardHeader>
              <CardTitle>Por categoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {summary.byCategory.length > 0 ? (
                summary.byCategory.map((item) => (
                  <div key={item.category} className="rounded-xl border border-slate-200 px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-medium text-slate-900">{categoryLabels[item.category]}</span>
                      <span className="text-sm font-semibold text-slate-950">{item.total}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{formatCurrency(item.amount)}</p>
                  </div>
                ))
              ) : (
                <EmptyState title="Sem dados por categoria" description="As categorias de despesas aparecerão aqui." />
              )}
            </CardContent>
          </Card>

          {/* Despesas Fixas */}
          <Card>
            <CardHeader>
              <CardTitle>Despesas Fixas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recurringExpenses.length > 0 ? (
                <div className="space-y-2">
                  {recurringExpenses.map((re) => (
                    <div key={re.id} className={`rounded-xl border ${re.active ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50/40 opacity-60"}`}>
                      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${re.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                          {re.active ? "Ativa" : "Pausada"}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                          {frequencyLabels[re.frequency]}
                        </span>
                        <span className="text-sm font-medium text-slate-900">{re.description}</span>
                        <span className="ml-auto text-sm font-semibold text-slate-950">{formatCurrency(re.baseAmount)}</span>
                        <form action={toggleRecurringExpense}>
                          <input type="hidden" name="re_id" value={re.id} />
                          <input type="hidden" name="re_active" value={re.active ? "false" : "true"} />
                          <Button type="submit" variant="outline" size="sm">
                            {re.active ? "Pausar" : "Reativar"}
                          </Button>
                        </form>
                      </div>

                      <details className="group border-t border-slate-100">
                        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800">
                          <span className="group-open:hidden">▸ Editar dados</span>
                          <span className="hidden group-open:inline">▾ Fechar edição</span>
                        </summary>
                        <form action={updateRecurringExpense} className="space-y-3 px-4 pb-4 pt-2">
                          <input type="hidden" name="re_id" value={re.id} />
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="grid gap-1">
                              <label className="text-xs font-medium text-slate-500">Descrição</label>
                              <Input name="re_description" defaultValue={re.description} placeholder="Descrição" required />
                            </div>
                            <div className="grid gap-1">
                              <label className="text-xs font-medium text-slate-500">Categoria</label>
                              <Select name="re_category" defaultValue={re.category}>
                                {Object.entries(categoryLabels).map(([value, label]) => (
                                  <option key={value} value={value}>{label}</option>
                                ))}
                              </Select>
                            </div>
                            <div className="grid gap-1">
                              <label className="text-xs font-medium text-slate-500">Valor base (R$)</label>
                              <CurrencyInput name="re_baseAmount" defaultValue={re.baseAmount} required />
                            </div>
                            <div className="grid gap-1">
                              <label className="text-xs font-medium text-slate-500">Forma de pagamento</label>
                              <Select name="re_paymentMethod" defaultValue={re.paymentMethod ?? ""}>
                                <option value="">Sem preferência</option>
                                {PAYMENT_METHODS.map((m) => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </Select>
                            </div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="grid gap-1">
                              <label className="text-xs font-medium text-slate-500">Frequência</label>
                              <Select name="re_frequency" defaultValue={re.frequency}>
                                {Object.entries(frequencyLabels).map(([value, label]) => (
                                  <option key={value} value={value}>{label}</option>
                                ))}
                              </Select>
                            </div>
                            <div className="grid gap-1">
                              <label className="text-xs font-medium text-slate-500">Dia do vencimento</label>
                              <Input name="re_dayOfMonth" type="number" min="1" max="28" defaultValue={re.dayOfMonth} placeholder="1–28" required />
                            </div>
                            <div className="grid gap-1">
                              <label className="text-xs font-medium text-slate-500">Início da vigência</label>
                              <Input name="re_startDate" type="date" defaultValue={toDateInput(re.startDate)} required />
                            </div>
                            <div className="grid gap-1">
                              <label className="text-xs font-medium text-slate-500">Fim da vigência (opcional)</label>
                              <Input name="re_endDate" type="date" defaultValue={toDateInput(re.endDate ?? "")} />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button type="submit" size="sm">Salvar alterações</Button>
                          </div>
                        </form>
                      </details>
                    </div>
                  ))}
                </div>
              ) : null}

              <details className="group">
                <summary className="cursor-pointer list-none">
                  <div className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-400 hover:text-slate-800">
                    <span className="text-lg leading-none">+</span> Nova despesa fixa
                  </div>
                </summary>
                <form action={createRecurringExpense} className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-1">
                      <label className="text-xs font-medium text-slate-500">Descrição</label>
                      <Input name="re_description" placeholder="Ex: Aluguel sede" required />
                    </div>
                    <div className="grid gap-1">
                      <label className="text-xs font-medium text-slate-500">Categoria</label>
                      <Select name="re_category" defaultValue="OUTROS">
                        {Object.entries(categoryLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="grid gap-1">
                      <label className="text-xs font-medium text-slate-500">Valor base (R$)</label>
                      <CurrencyInput name="re_baseAmount" required />
                    </div>
                    <div className="grid gap-1">
                      <label className="text-xs font-medium text-slate-500">Forma de pagamento</label>
                      <Select name="re_paymentMethod" defaultValue="">
                        <option value="">Sem preferência</option>
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-1">
                      <label className="text-xs font-medium text-slate-500">Frequência</label>
                      <Select name="re_frequency" defaultValue="MENSAL">
                        {Object.entries(frequencyLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="grid gap-1">
                      <label className="text-xs font-medium text-slate-500">Dia do vencimento</label>
                      <Input name="re_dayOfMonth" type="number" min="1" max="28" placeholder="1–28" defaultValue="1" required />
                    </div>
                    <div className="grid gap-1">
                      <label className="text-xs font-medium text-slate-500">Início da vigência</label>
                      <Input name="re_startDate" type="date" required />
                    </div>
                    <div className="grid gap-1">
                      <label className="text-xs font-medium text-slate-500">Fim da vigência (opcional)</label>
                      <Input name="re_endDate" type="date" />
                    </div>
                  </div>
                  <Textarea name="re_notes" placeholder="Observações" />
                  <div className="flex justify-end">
                    <Button type="submit">Criar despesa fixa</Button>
                  </div>
                </form>
              </details>
            </CardContent>
          </Card>
        </div>
      </section>

      <PaginationControls
        pathname="/financeiro/despesas"
        page={result.page}
        totalPages={result.totalPages}
        params={{
          query: query ?? "",
          from: from ?? "",
          to: to ?? "",
          category: category ?? "",
          expenseStatus: expenseStatus ?? "",
          sort
        }}
      />
    </div>
  );
}
