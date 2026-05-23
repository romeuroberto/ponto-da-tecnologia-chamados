-- AlterTable: make serialNumber optional on Equipment
ALTER TABLE "Equipment" ALTER COLUMN "serialNumber" DROP NOT NULL;
