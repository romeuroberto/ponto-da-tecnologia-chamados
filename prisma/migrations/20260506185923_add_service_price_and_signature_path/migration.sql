-- AlterTable
ALTER TABLE "CompanyProfile" ADD COLUMN     "logoPath" TEXT,
ADD COLUMN     "signaturePath" TEXT;

-- AlterTable
ALTER TABLE "ServiceOrder" ADD COLUMN     "servicePrice" DECIMAL(12,2);
