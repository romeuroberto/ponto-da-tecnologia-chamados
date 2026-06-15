ALTER TABLE "FiscalDocumentLink" ADD COLUMN "monthlyBillingId" TEXT;
ALTER TABLE "FiscalDocumentLink" ADD COLUMN "rentalBillingId" TEXT;

CREATE INDEX "FiscalDocumentLink_monthlyBillingId_idx" ON "FiscalDocumentLink"("monthlyBillingId");
CREATE INDEX "FiscalDocumentLink_rentalBillingId_idx" ON "FiscalDocumentLink"("rentalBillingId");

ALTER TABLE "FiscalDocumentLink" ADD CONSTRAINT "FiscalDocumentLink_monthlyBillingId_fkey" FOREIGN KEY ("monthlyBillingId") REFERENCES "ContractMonthlyBilling"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FiscalDocumentLink" ADD CONSTRAINT "FiscalDocumentLink_rentalBillingId_fkey" FOREIGN KEY ("rentalBillingId") REFERENCES "RentalBilling"("id") ON DELETE CASCADE ON UPDATE CASCADE;
