-- CreateEnum
CREATE TYPE "FiscalDocumentType" AS ENUM ('NFSE', 'NFE', 'RECIBO', 'OUTRO');

-- CreateTable
CREATE TABLE "PaymentInstruction" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "title" TEXT NOT NULL,
    "paymentChannel" TEXT NOT NULL,
    "pixKey" TEXT,
    "pixCopyPaste" TEXT,
    "qrCodeImagePath" TEXT,
    "bankName" TEXT,
    "bankAgency" TEXT,
    "bankAccount" TEXT,
    "accountHolder" TEXT,
    "accountDocument" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentInstruction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalDocument" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "FiscalDocumentType" NOT NULL DEFAULT 'OUTRO',
    "number" TEXT NOT NULL,
    "series" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(12,2),
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalDocumentLink" (
    "id" TEXT NOT NULL,
    "fiscalDocumentId" TEXT NOT NULL,
    "ticketId" TEXT,
    "saleId" TEXT,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FiscalDocumentLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentInstruction_clientId_active_sortOrder_idx" ON "PaymentInstruction"("clientId", "active", "sortOrder");

-- CreateIndex
CREATE INDEX "FiscalDocument_clientId_issueDate_idx" ON "FiscalDocument"("clientId", "issueDate");

-- CreateIndex
CREATE INDEX "FiscalDocumentLink_fiscalDocumentId_idx" ON "FiscalDocumentLink"("fiscalDocumentId");

-- CreateIndex
CREATE INDEX "FiscalDocumentLink_ticketId_idx" ON "FiscalDocumentLink"("ticketId");

-- CreateIndex
CREATE INDEX "FiscalDocumentLink_saleId_idx" ON "FiscalDocumentLink"("saleId");

-- AddForeignKey
ALTER TABLE "PaymentInstruction" ADD CONSTRAINT "PaymentInstruction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalDocument" ADD CONSTRAINT "FiscalDocument_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalDocumentLink" ADD CONSTRAINT "FiscalDocumentLink_fiscalDocumentId_fkey" FOREIGN KEY ("fiscalDocumentId") REFERENCES "FiscalDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalDocumentLink" ADD CONSTRAINT "FiscalDocumentLink_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalDocumentLink" ADD CONSTRAINT "FiscalDocumentLink_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
