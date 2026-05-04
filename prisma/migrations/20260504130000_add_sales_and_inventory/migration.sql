-- StockMovementType enum
CREATE TYPE "StockMovementType" AS ENUM ('ENTRY', 'SALE_EXIT', 'SERVICE_ORDER_EXIT', 'ADJUSTMENT');

-- stockQuantity on PartCatalogItem
ALTER TABLE "PartCatalogItem" ADD COLUMN "stockQuantity" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Sale
CREATE TABLE "Sale" (
    "id"                 TEXT NOT NULL,
    "number"             TEXT NOT NULL,
    "clientId"           TEXT NOT NULL,
    "financialStatus"    "FinancialStatus" NOT NULL DEFAULT 'PENDENTE',
    "paymentMethod"      TEXT,
    "paymentDate"        TIMESTAMP(3),
    "paymentReference"   TEXT,
    "internalNotes"      TEXT,
    "totalAmount"        DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paidAt"             TIMESTAMP(3),
    "canceledAt"         TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdById"        TEXT NOT NULL,
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Sale_number_key" ON "Sale"("number");

-- SaleItem
CREATE TABLE "SaleItem" (
    "id"                TEXT NOT NULL,
    "saleId"            TEXT NOT NULL,
    "partCatalogItemId" TEXT NOT NULL,
    "partName"          TEXT NOT NULL,
    "partCode"          TEXT,
    "quantity"          DECIMAL(10,2) NOT NULL,
    "unitPrice"         DECIMAL(12,2) NOT NULL,
    "totalPrice"        DECIMAL(12,2) NOT NULL,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- StockMovement
CREATE TABLE "StockMovement" (
    "id"                 TEXT NOT NULL,
    "partCatalogItemId"  TEXT NOT NULL,
    "type"               "StockMovementType" NOT NULL,
    "quantity"           DECIMAL(10,2) NOT NULL,
    "saleId"             TEXT,
    "serviceOrderPartId" TEXT,
    "notes"              TEXT,
    "createdById"        TEXT NOT NULL,
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "Sale"          ADD CONSTRAINT "Sale_clientId_fkey"          FOREIGN KEY ("clientId")           REFERENCES "Client"("id")          ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Sale"          ADD CONSTRAINT "Sale_createdById_fkey"        FOREIGN KEY ("createdById")        REFERENCES "User"("id")            ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleItem"      ADD CONSTRAINT "SaleItem_saleId_fkey"         FOREIGN KEY ("saleId")             REFERENCES "Sale"("id")            ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "SaleItem"      ADD CONSTRAINT "SaleItem_partCatalogItemId_fkey" FOREIGN KEY ("partCatalogItemId") REFERENCES "PartCatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_partCatalogItemId_fkey" FOREIGN KEY ("partCatalogItemId") REFERENCES "PartCatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_createdById_fkey"      FOREIGN KEY ("createdById")        REFERENCES "User"("id")            ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_saleId_fkey"           FOREIGN KEY ("saleId")             REFERENCES "Sale"("id")            ON DELETE SET NULL ON UPDATE CASCADE;
