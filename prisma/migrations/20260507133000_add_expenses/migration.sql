CREATE TYPE "ExpenseStatus" AS ENUM ('PENDENTE', 'PAGA', 'CANCELADA');

CREATE TYPE "ExpenseCategory" AS ENUM (
    'ALUGUEL',
    'ENERGIA',
    'INTERNET',
    'TRANSPORTE',
    'COMBUSTIVEL',
    'ALIMENTACAO',
    'PECAS_INSUMOS',
    'FERRAMENTAS_EQUIPAMENTOS',
    'IMPOSTOS_TAXAS',
    'SERVICOS_TERCEIROS',
    'OUTROS'
);

CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDENTE',
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "notes" TEXT,
    "ticketId" TEXT,
    "createdById" TEXT NOT NULL,
    "cancellationReason" TEXT,
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Expense_expenseDate_status_idx" ON "Expense"("expenseDate", "status");
CREATE INDEX "Expense_category_idx" ON "Expense"("category");
CREATE INDEX "Expense_ticketId_idx" ON "Expense"("ticketId");

ALTER TABLE "Expense" ADD CONSTRAINT "Expense_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
