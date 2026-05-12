-- CreateTable
CREATE TABLE "ContractMonthlyBilling" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "referenceMonth" INTEGER NOT NULL,
    "referenceYear" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "financialStatus" "FinancialStatus" NOT NULL DEFAULT 'PENDENTE',
    "paidAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractMonthlyBilling_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContractMonthlyBilling_contractId_referenceYear_referenceMo_key" ON "ContractMonthlyBilling"("contractId", "referenceYear", "referenceMonth");

-- AddForeignKey
ALTER TABLE "ContractMonthlyBilling" ADD CONSTRAINT "ContractMonthlyBilling_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ClientContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractMonthlyBilling" ADD CONSTRAINT "ContractMonthlyBilling_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
