-- CreateTable
CREATE TABLE "ServiceOrderPart" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "partCatalogItemId" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "partCode" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceOrderPart_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ServiceOrderPart" ADD CONSTRAINT "ServiceOrderPart_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrderPart" ADD CONSTRAINT "ServiceOrderPart_partCatalogItemId_fkey" FOREIGN KEY ("partCatalogItemId") REFERENCES "PartCatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
