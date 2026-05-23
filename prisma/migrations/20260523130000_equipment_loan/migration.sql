-- AlterTable: add isReserve flag to Equipment
ALTER TABLE "Equipment" ADD COLUMN "isReserve" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: EquipmentLoan
CREATE TABLE "EquipmentLoan" (
    "id"                  TEXT NOT NULL,
    "reserveEquipmentId"  TEXT NOT NULL,
    "mainEquipmentId"     TEXT,
    "clientId"            TEXT NOT NULL,
    "loanedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt"          TIMESTAMP(3),
    "notes"               TEXT,
    "createdById"         TEXT NOT NULL,
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentLoan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EquipmentLoan" ADD CONSTRAINT "EquipmentLoan_reserveEquipmentId_fkey"
    FOREIGN KEY ("reserveEquipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentLoan" ADD CONSTRAINT "EquipmentLoan_mainEquipmentId_fkey"
    FOREIGN KEY ("mainEquipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentLoan" ADD CONSTRAINT "EquipmentLoan_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentLoan" ADD CONSTRAINT "EquipmentLoan_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
