-- Migrate any RESOLVED tickets to CLOSED before removing the enum value
UPDATE "Ticket" SET status = 'CLOSED', "resolvedAt" = COALESCE("resolvedAt", "updatedAt") WHERE status = 'RESOLVED';

-- Migrate RESOLVED references in history to CLOSED
UPDATE "TicketHistory" SET "previousStatus" = 'CLOSED' WHERE "previousStatus" = 'RESOLVED';
UPDATE "TicketHistory" SET "nextStatus" = 'CLOSED' WHERE "nextStatus" = 'RESOLVED';

-- Create new enum without RESOLVED
CREATE TYPE "TicketStatus_new" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'CLOSED', 'CANCELED');

-- Drop default before altering column type (PostgreSQL requirement)
ALTER TABLE "Ticket" ALTER COLUMN "status" DROP DEFAULT;

-- Alter column to use new enum
ALTER TABLE "Ticket" ALTER COLUMN "status" TYPE "TicketStatus_new" USING "status"::text::"TicketStatus_new";
ALTER TABLE "TicketHistory" ALTER COLUMN "previousStatus" TYPE "TicketStatus_new" USING "previousStatus"::text::"TicketStatus_new";
ALTER TABLE "TicketHistory" ALTER COLUMN "nextStatus" TYPE "TicketStatus_new" USING "nextStatus"::text::"TicketStatus_new";

-- Drop old enum and rename new one
DROP TYPE "TicketStatus";
ALTER TYPE "TicketStatus_new" RENAME TO "TicketStatus";

-- Restore default
ALTER TABLE "Ticket" ALTER COLUMN "status" SET DEFAULT 'OPEN'::"TicketStatus";
