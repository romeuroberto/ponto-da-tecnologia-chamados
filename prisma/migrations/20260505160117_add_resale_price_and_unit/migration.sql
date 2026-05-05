-- AlterTable
ALTER TABLE "PartCatalogItem" ADD COLUMN     "resalePrice" DECIMAL(12,2),
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'un';

-- AlterTable
ALTER TABLE "ServiceCatalogItem" ADD COLUMN     "resalePrice" DECIMAL(12,2);
