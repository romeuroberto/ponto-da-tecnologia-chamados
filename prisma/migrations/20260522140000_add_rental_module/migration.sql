-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('DISPONIVEL', 'LOCADO', 'MANUTENCAO', 'BAIXADO');

-- CreateEnum
CREATE TYPE "RentalContractStatus" AS ENUM ('RASCUNHO', 'ATIVO', 'ENCERRADO', 'EXPIRADO');

-- AlterTable: add optional equipmentId to Ticket
ALTER TABLE "Ticket" ADD COLUMN "equipmentId" TEXT;

-- CreateTable: Equipment
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "patrimonyCode" TEXT,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'DISPONIVEL',
    "purchaseDate" TIMESTAMP(3),
    "purchaseCost" DECIMAL(12,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: RentalContract
CREATE TABLE "RentalContract" (
    "id" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "RentalContractStatus" NOT NULL DEFAULT 'RASCUNHO',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "noticeDays" INTEGER NOT NULL DEFAULT 30,
    "totalMonthlyValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable: RentalContractItem
CREATE TABLE "RentalContractItem" (
    "id" TEXT NOT NULL,
    "rentalContractId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "monthlyPrice" DECIMAL(12,2) NOT NULL,
    "installedAt" TIMESTAMP(3) NOT NULL,
    "returnedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalContractItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable: RentalBilling
CREATE TABLE "RentalBilling" (
    "id" TEXT NOT NULL,
    "rentalContractId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "referenceMonth" INTEGER NOT NULL,
    "referenceYear" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "financialStatus" "FinancialStatus" NOT NULL DEFAULT 'PENDENTE',
    "paymentMethod" TEXT,
    "paymentDate" TIMESTAMP(3),
    "paymentReference" TEXT,
    "paidAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalBilling_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_serialNumber_key" ON "Equipment"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RentalContract_contractNumber_key" ON "RentalContract"("contractNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RentalBilling_rentalContractId_referenceYear_referenceMonth_key"
    ON "RentalBilling"("rentalContractId", "referenceYear", "referenceMonth");

-- AddForeignKey: Ticket.equipmentId → Equipment
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_equipmentId_fkey"
    FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: RentalContract.clientId
ALTER TABLE "RentalContract" ADD CONSTRAINT "RentalContract_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: RentalContract.createdById
ALTER TABLE "RentalContract" ADD CONSTRAINT "RentalContract_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: RentalContractItem.rentalContractId
ALTER TABLE "RentalContractItem" ADD CONSTRAINT "RentalContractItem_rentalContractId_fkey"
    FOREIGN KEY ("rentalContractId") REFERENCES "RentalContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: RentalContractItem.equipmentId
ALTER TABLE "RentalContractItem" ADD CONSTRAINT "RentalContractItem_equipmentId_fkey"
    FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: RentalBilling.rentalContractId
ALTER TABLE "RentalBilling" ADD CONSTRAINT "RentalBilling_rentalContractId_fkey"
    FOREIGN KEY ("rentalContractId") REFERENCES "RentalContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: RentalBilling.clientId
ALTER TABLE "RentalBilling" ADD CONSTRAINT "RentalBilling_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: RentalBilling.createdById
ALTER TABLE "RentalBilling" ADD CONSTRAINT "RentalBilling_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
