-- AlterTable
ALTER TABLE "TicketBilling" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "invoiceDueDate" TIMESTAMP(3),
ADD COLUMN     "invoiceNumber" TEXT,
ADD COLUMN     "paymentDate" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentReference" TEXT;
