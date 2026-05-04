-- AlterTable
ALTER TABLE "PartCatalogItem" ADD COLUMN     "costPrice" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ServiceCatalogItem" ADD COLUMN     "defaultPrice" DECIMAL(12,2) NOT NULL DEFAULT 0;
