-- AlterTable: remove vestigial fields and rename contractNotes to billingInstructions
ALTER TABLE "ClientBillingProfile" DROP COLUMN IF EXISTS "hasActiveContract";
ALTER TABLE "ClientBillingProfile" DROP COLUMN IF EXISTS "contractCoveredCategories";
ALTER TABLE "ClientBillingProfile" RENAME COLUMN "contractNotes" TO "billingInstructions";
