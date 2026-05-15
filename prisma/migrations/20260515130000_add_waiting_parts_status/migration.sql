-- AlterEnum
ALTER TYPE "TicketStatus" ADD VALUE 'WAITING_PARTS';

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "waitingPartsStartedAt" TIMESTAMP(3);
ALTER TABLE "Ticket" ADD COLUMN "slaWaitingPartsMs" INTEGER NOT NULL DEFAULT 0;
