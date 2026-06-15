import { z } from "zod";

export const companyProfileSchema = z.object({
  legalName: z.string().min(2),
  tradeName: z.string().optional(),
  document: z.string().min(11),
  stateRegistration: z.string().optional(),
  municipalRegistration: z.string().optional(),
  financialEmail: z.union([z.string().email(), z.literal("")]).optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  notes: z.string().optional()
});

export const paymentInstructionSchema = z.object({
  clientId: z.string().optional(),
  title: z.string().min(2),
  paymentChannel: z.string().min(2),
  pixKey: z.string().optional(),
  pixCopyPaste: z.string().optional(),
  qrCodeImagePath: z.string().optional(),
  bankName: z.string().optional(),
  bankAgency: z.string().optional(),
  bankAccount: z.string().optional(),
  accountHolder: z.string().optional(),
  accountDocument: z.string().optional(),
  notes: z.string().optional(),
  active: z.boolean(),
  sortOrder: z.number().int().min(0)
});

export const fiscalDocumentSchema = z.object({
  clientId: z.string().min(1),
  type: z.enum(["NFSE", "NFE", "RECIBO", "OUTRO"]),
  number: z.string().min(1),
  series: z.string().optional(),
  issueDate: z.string().min(1),
  totalAmount: z.number().min(0).optional(),
  fileName: z.string().min(1),
  filePath: z.string().min(1),
  notes: z.string().optional(),
  ticketIds: z.array(z.string()).default([]),
  saleIds: z.array(z.string()).default([]),
  monthlyBillingIds: z.array(z.string()).default([]),
  rentalBillingIds: z.array(z.string()).default([])
});
