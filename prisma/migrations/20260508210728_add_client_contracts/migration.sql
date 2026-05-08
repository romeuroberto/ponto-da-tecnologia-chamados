-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('RASCUNHO', 'ATIVO', 'ENCERRADO', 'EXPIRADO');

-- CreateEnum
CREATE TYPE "ContractCoverageType" AS ENUM ('TOTAL', 'PARCIAL');

-- CreateTable
CREATE TABLE "ClientContract" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "ContractStatus" NOT NULL DEFAULT 'ATIVO',
    "coverageType" "ContractCoverageType" NOT NULL DEFAULT 'PARCIAL',
    "monthlyValue" DECIMAL(12,2),
    "coveredCategories" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientContract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientContract_contractNumber_key" ON "ClientContract"("contractNumber");

-- AddForeignKey
ALTER TABLE "ClientContract" ADD CONSTRAINT "ClientContract_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
