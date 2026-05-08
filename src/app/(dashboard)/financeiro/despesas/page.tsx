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
import { PAYMENT_METHODS } from "@/lib/billing-rules";
import { formatCurrency } from "@/lib/utils";
import { expenseCancelSchema, expensePaySchema, expenseSchema, recurringExpenseSchema } from "@/lib/validations/expense";
import { requireRole } from "@/server/auth/session";
import { expenseService } from "@/server/services/expense-service";
import { recurringExpenseRepository } from "@/server/repositories/recurring-expense-repository";
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
  const exportParams = new URLSearchParams();

  if (from) exportParams.set("from", from);
  if (to) exportParams.set("to", to);

  await recurringExpenseRepository.generateOccurrences();

  const [result, summary, recurringExpenses] = await Promise.all([
    expenseService.searchExpenses({
      from,
      to,
      query,
      category,
      status: expenseStatus,
      sort,
      page
    }),
    expenseService.getSummary({
      from,
      to,
      query,
      category,
      status: expenseStatus
    }),
    recurringExpenseRepository.listAll()
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
      notes: formData.get("notes")?.toString() ?? ""
    });

    if (!parsed.success) {
      redirect(toRedirectMessage("/financeiro/despesas", "error", "Confira os dados da nova despesa."));
    }

    try {
      await expenseService.createExpense({
        ...parsed.data,
        createdById: user.id
      });
      revalidatePath("/financeiro");
      revalidatePath("/financeiro/despesas");
      redirect(toRedirectMessage("/financeiro/despesas", "success", "Despesa criada com sucesso."));
    } catch (error) {
      redirect(toRedirectMessage("/financeiro/despesas", "error", error instanceof Error ? error.message : "Falha ao criar despesa."));
    }
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
      notes: formData.get("notes")?.toString() ?? ""
    });

    if (!id || !parsed.success) {
      redirect(toRedirectMessage("/financeiro/despesas", "error", "Confira os dados da despesa."));
    }

    try {
      await expenseService.updateExpense(id, parsed.data, user.id);
      revalidatePath("/financeiro");
      revalidatePath("/financeiro/despesas");
      redirect(toRedirectMessage("/financeiro/despesas", "success", "Despesa atualizada."));
    } catch (error) {
      redirect(toRedirectMessage("/financeiro/despesas", "error", error instanceof Error ? error.message : "Falha ao atualizar despesa."));
    }
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

    try {
      await expenseService.payExpense(id, parsed.data, user.id);
      revalidatePath("/financeiro");
      revalidatePath("/financeiro/despesas");
      redirect(toRedirectMessage("/financeiro/despesas", "success", "Despesa marcada como paga."));
    } catch (error) {
      redirect(toRedirectMessage("/financeiro/despesas", "error", error instanceof Error ? error.message : "Falha ao pagar despesa."));
    }
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

    try {
      await expenseService.cancelExpense(id, parsed.data, user.id);
      revalidatePath("/financeiro");
      revalidatePath("/financeiro/despesas");
      redirect(toRedirectMessage("/financeiro/despesas", "success", "Despesa cancelada."));
    } catch (error) {
      redirect(toRedirectMessage("/financeiro/despesas", "error", error instanceof Error ? error.message : "Falha ao cancelar despesa."));
    }
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

    try {
      await recurringExpenseRepository.create(parsed.data, user.id);
      revalidatePath("/financeiro/despesas");
      redirect(toRedirectMessage("/financeiro/despesas", "success", "Despesa fixa criada com sucesso."));
    } catch (error) {
      redirect(toRedirectMessage("/financeiro/despesas", "error", error instanceof Error ? error.message : "Falha ao criar despesa fixa."));
    }
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

    try {
      await recurringExpenseRepository.update(id, parsed.data);
      revalidatePath("/financeiro/despesas");
      redirect(toRedirectMessage("/financeiro/despesas", "success", "Despesa fixa atualizada."));
    } catch (error) {
      redirect(toRedirectMessage("/financeiro/despesas", "error", error instanceof Error ? error.message : "Falha ao atualizar despesa fixa."));
    }
  }

  async function toggleRecurringExpense(formData: FormData) {
    "use server";
    await requireRole(["ADMIN", "ATTENDANT"]);
    const id = formData.get("re_id")?.toString() ?? "";
    const active = formData.get("re_active")?.toString() === "true";

    if (!id) {
      redirect(toRedirectMessage("/financeiro/despesas", "error", "ID inválido."));
    }

    try {
      await recurringExpenseRepository.setActive(id, active);
      revalidatePath("/financeiro/despesas");
      redirect(toRedirectMessage("/financeiro/despesas", "success", active ? "Despesa fixa reativada." : "Despesa fixa pausada."));
    } catch (error) {
      redirect(toRedirectMessage("/financeiro/despesas", "error", error instanceof Error ? error.message : "Falha ao atualizar despesa fixa."));
    }
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

      <ResultsSummary label="despesas" total={result.total} page={result.page} totalPages={result.totalPages} />

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

      {/* Despesas Fixas */}
      <Card>
        <CardHeader>
          <CardTitle>Despesas Fixas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recurringExpenses.length > 0 ? (
            <div className="space-y-3">
              {recurringExpenses.map((re) => (
                <div key={re.id} className={`rounded-xl border px-4 py-3 ${re.active ? "border-slate-200 bg-slate-50" : "border-slate-100 bg-slate-50/40 opacity-60"}`}>
                  <div className="flex flex-wrap items-center gap-2 pb-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${re.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                      {re.active ? "Ativa" : "Pausada"}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                      {frequencyLabels[re.frequency]}
                    </span>
                    <span className="text-sm font-medium text-slate-900">{re.description}</span>
                    <span className="ml-auto text-sm font-semibold text-slate-900">{formatCurrency(re.baseAmount)}</span>
                  </div>
                  <form id={`re-update-${re.id}`} action={updateRecurringExpense} className="space-y-3">
                    <input type="hidden" name="re_id" value={re.id} />
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                        <Input name="re_baseAmount" type="number" step="0.01" min="0.01" defaultValue={re.baseAmount} placeholder="0,00" required />
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
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                  </form>
                  <form action={toggleRecurringExpense} className="mt-3 flex flex-wrap gap-2">
                    <input type="hidden" name="re_id" value={re.id} />
                    <input type="hidden" name="re_active" value={re.active ? "false" : "true"} />
                    <Button type="submit" form={`re-update-${re.id}`} variant="secondary" size="sm">Salvar</Button>
                    <Button type="submit" variant="outline" size="sm">
                      {re.active ? "Pausar" : "Reativar"}
                    </Button>
                  </form>
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
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                  <Input name="re_baseAmount" type="number" step="0.01" min="0.01" placeholder="0,00" required />
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
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

      <ActiveFilters pathname="/financeiro/despesas" filters={activeFilters} />

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
            <div className="flex gap-2 lg:col-span-6">
              <input type="hidden" name="page" value="1" />
              <Button type="submit" className="flex-1">Aplicar filtros</Button>
              <a
                href="/financeiro/despesas"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
              >
                Limpar
              </a>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
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
              <Input name="amount" type="number" step="0.01" min="0.01" placeholder="Valor" required />
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
            <Textarea name="notes" placeholder="Observações" />
            <div className="flex justify-end">
              <Button type="submit">Criar despesa</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          {result.items.length > 0 ? (
            result.items.map((expense) => (
              <Card key={expense.id}>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-base">
                    <div className="flex items-center gap-2">
                      <span>{expense.description}</span>
                      {expense.recurringExpenseId ? (
                        <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">Fixa</span>
                      ) : null}
                    </div>
                    <span className="text-sm text-slate-500">{statusLabels[expense.status]}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 md:grid-cols-2">
                    <p><span className="font-semibold text-slate-900">Categoria:</span> {categoryLabels[expense.category]}</p>
                    <p><span className="font-semibold text-slate-900">Valor:</span> {formatCurrency(expense.amount)}</p>
                    <p><span className="font-semibold text-slate-900">Data da despesa:</span> {new Date(expense.expenseDate).toLocaleDateString("pt-BR")}</p>
                    <p><span className="font-semibold text-slate-900">Lançado por:</span> {expense.createdByName}</p>
                    {expense.referenceMonth && expense.referenceYear ? (
                      <p><span className="font-semibold text-slate-900">Referência:</span> {String(expense.referenceMonth).padStart(2, "0")}/{expense.referenceYear}</p>
                    ) : null}
                    {expense.cancellationReason ? (
                      <p className="md:col-span-2">
                        <span className="font-semibold text-slate-900">Motivo do cancelamento:</span> {expense.cancellationReason}
                      </p>
                    ) : null}
                  </div>

                  <form action={updateExpense} className="grid gap-4">
                    <input type="hidden" name="id" value={expense.id} />
                    <div className="grid gap-4 lg:grid-cols-3">
                      <Input name="description" defaultValue={expense.description} disabled={expense.status === "CANCELADA"} required />
                      <Select name="category" defaultValue={expense.category} disabled={expense.status === "CANCELADA"}>
                        {Object.entries(categoryLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </Select>
                      <Input
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        defaultValue={expense.amount}
                        disabled={expense.status === "CANCELADA"}
                        required
                      />
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <Input name="expenseDate" type="date" defaultValue={toDateInput(expense.expenseDate)} disabled={expense.status === "CANCELADA"} required />
                      <Select name="paymentMethod" defaultValue={expense.paymentMethod ?? ""} disabled={expense.status === "CANCELADA"}>
                        <option value="">Forma de pagamento</option>
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </Select>
                    </div>

                    <Textarea name="notes" defaultValue={expense.notes ?? ""} disabled={expense.status === "CANCELADA"} />

                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" variant="secondary" disabled={expense.status === "CANCELADA"}>
                        Salvar alterações
                      </Button>
                      {expense.status === "PENDENTE" ? (
                        <>
                          <Input
                            name="paidAt"
                            type="date"
                            defaultValue={toDateInput(expense.paidAt ?? expense.expenseDate)}
                            className="max-w-48"
                          />
                          <Button type="submit" formAction={payExpense}>Marcar como paga</Button>
                          <Input
                            name="cancellationReason"
                            placeholder="Motivo do cancelamento"
                            className="min-w-64 flex-1"
                          />
                          <Button type="submit" formAction={cancelExpense} variant="outline">Cancelar despesa</Button>
                        </>
                      ) : null}
                    </div>
                  </form>
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyState
              title="Nenhuma despesa encontrada"
              description="Ajuste os filtros ou crie a primeira despesa para começar o controle do caixa."
            />
          )}
        </div>

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
