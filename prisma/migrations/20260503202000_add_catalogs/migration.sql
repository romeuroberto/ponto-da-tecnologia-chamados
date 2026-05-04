CREATE TABLE "ServiceCatalogItem" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ServiceCatalogItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PartCatalogItem" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "description" TEXT,
  "unitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PartCatalogItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceCatalogItem_code_key" ON "ServiceCatalogItem"("code");
CREATE UNIQUE INDEX "PartCatalogItem_code_key" ON "PartCatalogItem"("code");
