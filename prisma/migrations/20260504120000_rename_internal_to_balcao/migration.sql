-- Rename enum value INTERNAL -> BALCAO (PostgreSQL 10+ supports this atomically)
ALTER TYPE "TicketAttendanceType" RENAME VALUE 'INTERNAL' TO 'BALCAO';

-- Update column default
ALTER TABLE "Ticket" ALTER COLUMN "attendanceType" SET DEFAULT 'BALCAO';
