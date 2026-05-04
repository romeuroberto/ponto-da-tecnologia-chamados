CREATE TYPE "ServiceOrderStatus" AS ENUM ('PLANNED', 'IN_EXECUTION', 'PAUSED', 'COMPLETED', 'CANCELED');

CREATE TABLE "ServiceOrder" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" "ServiceOrderStatus" NOT NULL DEFAULT 'PLANNED',
    "serviceType" TEXT,
    "assignedTechnicianId" TEXT,
    "scheduledStartAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "executionNotes" TEXT,
    "customerApprovalName" TEXT,
    "customerApprovalAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceOrder_number_key" ON "ServiceOrder"("number");

ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_assignedTechnicianId_fkey" FOREIGN KEY ("assignedTechnicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
