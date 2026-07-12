import type {
  AppUser,
  BillingEntry,
  BillingHistoryItem,
  Client,
  ClientBillingProfile,
  ClientComputerAccess,
  ClientComputer,
  ClientContract,
  CompanyProfile,
  Equipment,
  EquipmentLoan,
  Expense,
  FiscalDocument,
  FiscalDocumentLink,
  OsContribution,
  PaymentInstruction,
  RecurringExpense,
  RentalBilling,
  RentalContract,
  RentalContractItem,
  Sale,
  SaleItem,
  ServiceOrderPart,
  ServiceOrder,
  StockMovement,
  Ticket,
  TicketAttachment,
  TicketBilling,
  TicketCategory,
  TicketHistoryItem
} from "@/types";
import { normalizeBrazilianPhone } from "@/lib/utils";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: AppUser["role"];
  active: boolean;
}

interface ClientRecord {
  id: string;
  name: string;
  document: string | null;
  contactName: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  isReseller: boolean;
  active: boolean;
  billingProfile?: ClientBillingProfileRecord | null;
  _count?: {
    tickets: number;
  };
}

interface ClientBillingProfileRecord {
  id: string;
  clientId: string;
  defaultBillingType: ClientBillingProfile["defaultBillingType"];
  hourlyRate: PrismaDecimalLike | null;
  travelRate: PrismaDecimalLike | null;
  defaultDiscountPercent: PrismaDecimalLike | null;
  billingInstructions: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ClientComputerRecord {
  id: string;
  clientId: string;
  name: string;
  location: string | null;
  responsibleName: string | null;
  remoteTool: ClientComputer["remoteTool"];
  remoteCode: string | null;
  remotePassword: string | null;
  notes: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ClientComputerAccessRecord extends ClientComputerRecord {
  client: {
    name: string;
  };
}

interface CompanyProfileRecord {
  id: string;
  legalName: string;
  tradeName: string | null;
  document: string;
  stateRegistration: string | null;
  municipalRegistration: string | null;
  financialEmail: string | null;
  phone: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  notes: string | null;
  logoPath: string | null;
  signaturePath: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface TicketHistoryRecord {
  id: string;
  ticketId: string;
  eventType: TicketHistoryItem["eventType"];
  message: string;
  createdAt: Date;
  author: UserRecord;
}

interface TicketAttachmentRecord {
  id: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
}

interface ServiceOrderRecord {
  id: string;
  ticketId: string;
  number: string;
  status: ServiceOrder["status"];
  serviceType: string | null;
  servicePrice: PrismaDecimalLike | null;
  assignedTechnicianId: string | null;
  scheduledStartAt: Date | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  executionNotes: string | null;
  customerApprovalName: string | null;
  customerApprovalAt: Date | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  assignedTechnician: UserRecord | null;
  createdBy: UserRecord;
  parts?: ServiceOrderPartRecord[];
}

interface ServiceOrderPartRecord {
  id: string;
  serviceOrderId: string;
  partCatalogItemId: string;
  partName: string;
  partCode: string | null;
  quantity: PrismaDecimalLike;
  unitPrice: PrismaDecimalLike;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface TicketRecord {
  id: string;
  number: string;
  title: string;
  description: string;
  category: string | null;
  attendanceType?: Ticket["attendanceType"];
  priority: Ticket["priority"];
  status: Ticket["status"];
  requesterName: string;
  requesterEmail: string | null;
  clientId: string;
  assigneeId: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  closedAt: Date | null;
  closingReason: string | null;
  checkedInAt: Date | null;
  checkedOutAt: Date | null;
  waitingPartsStartedAt: Date | null;
  slaWaitingPartsMs: number;
  client: ClientRecord;
  assignee: UserRecord | null;
  openedBy: UserRecord;
  history: TicketHistoryRecord[];
  attachments?: TicketAttachmentRecord[];
  expenses?: ExpenseRecord[];
  serviceOrders?: ServiceOrderRecord[];
  billing?: TicketBillingRecord | null;
}

interface TicketBillingRecord {
  id: string;
  ticketId: string;
  billingType: TicketBilling["billingType"];
  financialStatus: TicketBilling["financialStatus"];
  subtotalAmount: PrismaDecimalLike;
  discountAmount: PrismaDecimalLike;
  totalAmount: PrismaDecimalLike;
  internalNotes: string | null;
  invoiceNumber: string | null;
  invoiceDueDate: Date | null;
  paymentMethod: string | null;
  paymentDate: Date | null;
  paymentReference: string | null;
  cancellationReason: string | null;
  approvedAt: Date | null;
  invoicedAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  entries: BillingEntryRecord[];
  history: BillingHistoryRecord[];
}

interface BillingEntryRecord {
  id: string;
  ticketBillingId: string;
  entryType: BillingEntry["entryType"];
  description: string;
  quantity: PrismaDecimalLike;
  unitPrice: PrismaDecimalLike;
  totalPrice: PrismaDecimalLike;
  billable: boolean;
  createdById: string;
  createdBy: UserRecord;
  createdAt: Date;
  updatedAt: Date;
}

interface BillingHistoryRecord {
  id: string;
  ticketBillingId: string;
  eventType: BillingHistoryItem["eventType"];
  message: string;
  createdAt: Date;
  author: UserRecord;
}

interface PrismaDecimalLike {
  toNumber(): number;
}

interface SaleItemRecord {
  id: string;
  saleId: string;
  partCatalogItemId: string;
  partName: string;
  partCode: string | null;
  quantity: PrismaDecimalLike;
  unitPrice: PrismaDecimalLike;
  totalPrice: PrismaDecimalLike;
  createdAt: Date;
}

interface SaleRecord {
  id: string;
  number: string;
  clientId: string;
  financialStatus: Sale["financialStatus"];
  paymentMethod: string | null;
  paymentDate: Date | null;
  paymentReference: string | null;
  internalNotes: string | null;
  deliveryFee?: PrismaDecimalLike;
  totalAmount: PrismaDecimalLike;
  paidAt: Date | null;
  canceledAt: Date | null;
  cancellationReason: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  client: { name: string };
  createdBy: UserRecord;
  items: SaleItemRecord[];
}

interface RecurringExpenseRecord {
  id: string;
  description: string;
  category: Expense["category"];
  baseAmount: PrismaDecimalLike;
  paymentMethod: string | null;
  frequency: RecurringExpense["frequency"];
  dayOfMonth: number;
  startDate: Date;
  endDate: Date | null;
  active: boolean;
  notes: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: UserRecord;
}

export function mapRecurringExpense(record: RecurringExpenseRecord): RecurringExpense {
  return {
    id: record.id,
    description: record.description,
    category: record.category,
    baseAmount: record.baseAmount.toNumber(),
    paymentMethod: record.paymentMethod ?? undefined,
    frequency: record.frequency,
    dayOfMonth: record.dayOfMonth,
    startDate: record.startDate.toISOString(),
    endDate: record.endDate?.toISOString() ?? undefined,
    active: record.active,
    notes: record.notes ?? undefined,
    createdById: record.createdById,
    createdByName: record.createdBy.name,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

interface ExpenseRecord {
  id: string;
  description: string;
  category: Expense["category"];
  amount: PrismaDecimalLike;
  status: Expense["status"];
  expenseDate: Date;
  paidAt: Date | null;
  paymentMethod: string | null;
  notes: string | null;
  ticketId: string | null;
  recurringExpenseId: string | null;
  referenceMonth: number | null;
  referenceYear: number | null;
  createdById: string;
  cancellationReason: string | null;
  canceledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  ticket?: { number: string; title: string } | null;
  createdBy: UserRecord;
}

interface StockMovementRecord {
  id: string;
  partCatalogItemId: string;
  type: StockMovement["type"];
  quantity: PrismaDecimalLike;
  saleId: string | null;
  serviceOrderPartId: string | null;
  notes: string | null;
  createdById: string;
  createdAt: Date;
  part: { name: string };
  createdBy: UserRecord;
}

interface PaymentInstructionRecord {
  id: string;
  clientId: string | null;
  title: string;
  paymentChannel: string;
  pixKey: string | null;
  pixCopyPaste: string | null;
  qrCodeImagePath: string | null;
  bankName: string | null;
  bankAgency: string | null;
  bankAccount: string | null;
  accountHolder: string | null;
  accountDocument: string | null;
  notes: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface FiscalDocumentLinkRecord {
  id: string;
  ticketId: string | null;
  saleId: string | null;
  monthlyBillingId: string | null;
  rentalBillingId: string | null;
  label: string | null;
  createdAt: Date;
}

interface FiscalDocumentRecord {
  id: string;
  clientId: string;
  type: FiscalDocument["type"];
  number: string;
  series: string | null;
  issueDate: Date;
  totalAmount: PrismaDecimalLike | null;
  fileName: string;
  filePath: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  links: FiscalDocumentLinkRecord[];
}

export function mapUser(record: UserRecord): AppUser {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
    active: record.active
  };
}

export function mapClient(record: ClientRecord): Client {
  return {
    id: record.id,
    name: record.name,
    document: record.document ?? undefined,
    contactName: record.contactName,
    email: record.email ?? undefined,
    phone: normalizeBrazilianPhone(record.phone),
    notes: record.notes ?? undefined,
    isReseller: record.isReseller,
    active: record.active,
    ticketCount: record._count?.tickets ?? 0,
    billingProfile: record.billingProfile ? mapClientBillingProfile(record.billingProfile) : undefined
  };
}

export function mapClientComputer(record: ClientComputerRecord): ClientComputer {
  return {
    id: record.id,
    clientId: record.clientId,
    name: record.name,
    location: record.location ?? undefined,
    responsibleName: record.responsibleName ?? undefined,
    remoteTool: record.remoteTool,
    remoteCode: record.remoteCode ?? undefined,
    remotePassword: record.remotePassword ?? undefined,
    notes: record.notes ?? undefined,
    active: record.active,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export function mapClientComputerAccess(record: ClientComputerAccessRecord): ClientComputerAccess {
  return {
    ...mapClientComputer(record),
    clientName: record.client.name
  };
}

export function mapCompanyProfile(record: CompanyProfileRecord): CompanyProfile {
  return {
    id: record.id,
    legalName: record.legalName,
    tradeName: record.tradeName ?? undefined,
    document: record.document,
    stateRegistration: record.stateRegistration ?? undefined,
    municipalRegistration: record.municipalRegistration ?? undefined,
    financialEmail: record.financialEmail ?? undefined,
    phone: normalizeBrazilianPhone(record.phone),
    website: record.website ?? undefined,
    addressLine1: record.addressLine1 ?? undefined,
    addressLine2: record.addressLine2 ?? undefined,
    city: record.city ?? undefined,
    state: record.state ?? undefined,
    postalCode: record.postalCode ?? undefined,
    notes: record.notes ?? undefined,
    logoPath: record.logoPath ?? undefined,
    signaturePath: record.signaturePath ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export function mapTicketHistory(record: TicketHistoryRecord): TicketHistoryItem {
  return {
    id: record.id,
    ticketId: record.ticketId,
    authorName: record.author.name,
    eventType: record.eventType,
    message: record.message,
    createdAt: record.createdAt.toISOString()
  };
}

export function mapTicketAttachment(record: TicketAttachmentRecord): TicketAttachment {
  return {
    id: record.id,
    fileName: record.fileName,
    filePath: record.filePath,
    mimeType: record.mimeType,
    sizeBytes: record.sizeBytes,
    createdAt: record.createdAt.toISOString()
  };
}

export function mapServiceOrder(record: ServiceOrderRecord): ServiceOrder {
  return {
    id: record.id,
    ticketId: record.ticketId,
    number: record.number,
    status: record.status,
    serviceType: record.serviceType ?? undefined,
    servicePrice: record.servicePrice ? record.servicePrice.toNumber() : undefined,
    assignedTechnicianId: record.assignedTechnicianId ?? undefined,
    assignedTechnicianName: record.assignedTechnician?.name ?? undefined,
    scheduledStartAt: record.scheduledStartAt?.toISOString() ?? undefined,
    startedAt: record.startedAt?.toISOString() ?? undefined,
    finishedAt: record.finishedAt?.toISOString() ?? undefined,
    executionNotes: record.executionNotes ?? undefined,
    customerApprovalName: record.customerApprovalName ?? undefined,
    customerApprovalAt: record.customerApprovalAt?.toISOString() ?? undefined,
    createdById: record.createdById,
    createdByName: record.createdBy.name,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    parts: (record.parts ?? []).map(mapServiceOrderPart)
  };
}

export function mapServiceOrderPart(record: ServiceOrderPartRecord): ServiceOrderPart {
  return {
    id: record.id,
    serviceOrderId: record.serviceOrderId,
    partCatalogItemId: record.partCatalogItemId,
    partName: record.partName,
    partCode: record.partCode ?? undefined,
    quantity: record.quantity.toNumber(),
    unitPrice: record.unitPrice.toNumber(),
    notes: record.notes ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export function mapBillingEntry(record: BillingEntryRecord): BillingEntry {
  return {
    id: record.id,
    ticketBillingId: record.ticketBillingId,
    entryType: record.entryType,
    description: record.description,
    quantity: record.quantity.toNumber(),
    unitPrice: record.unitPrice.toNumber(),
    totalPrice: record.totalPrice.toNumber(),
    billable: record.billable,
    createdById: record.createdById,
    createdByName: record.createdBy.name,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export function mapBillingHistory(record: BillingHistoryRecord): BillingHistoryItem {
  return {
    id: record.id,
    ticketBillingId: record.ticketBillingId,
    authorName: record.author.name,
    eventType: record.eventType,
    message: record.message,
    createdAt: record.createdAt.toISOString()
  };
}

export function mapTicketBilling(
  record: TicketBillingRecord,
  osContributions: OsContribution[] = [],
  activeContract?: ClientContract
): TicketBilling {
  return {
    id: record.id,
    ticketId: record.ticketId,
    billingType: record.billingType,
    financialStatus: record.financialStatus,
    subtotalAmount: record.subtotalAmount.toNumber(),
    discountAmount: record.discountAmount.toNumber(),
    totalAmount: record.totalAmount.toNumber(),
    internalNotes: record.internalNotes ?? undefined,
    invoiceNumber: record.invoiceNumber ?? undefined,
    invoiceDueDate: record.invoiceDueDate?.toISOString() ?? undefined,
    paymentMethod: record.paymentMethod ?? undefined,
    paymentDate: record.paymentDate?.toISOString() ?? undefined,
    paymentReference: record.paymentReference ?? undefined,
    cancellationReason: record.cancellationReason ?? undefined,
    approvedAt: record.approvedAt?.toISOString() ?? undefined,
    invoicedAt: record.invoicedAt?.toISOString() ?? undefined,
    paidAt: record.paidAt?.toISOString() ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    entries: record.entries.map(mapBillingEntry),
    history: record.history.map(mapBillingHistory),
    osContributions,
    osContributionsTotal: osContributions.reduce((s, c) => s + c.totalAmount, 0),
    activeContract
  };
}

export function mapClientBillingProfile(record: ClientBillingProfileRecord): ClientBillingProfile {
  return {
    id: record.id,
    clientId: record.clientId,
    defaultBillingType: record.defaultBillingType,
    hourlyRate: record.hourlyRate?.toNumber() ?? undefined,
    travelRate: record.travelRate?.toNumber() ?? undefined,
    defaultDiscountPercent: record.defaultDiscountPercent?.toNumber() ?? undefined,
    billingInstructions: record.billingInstructions ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export function mapTicket(record: TicketRecord): Ticket {
  return {
    id: record.id,
    number: record.number,
    title: record.title,
    description: record.description,
    category: record.category ?? undefined,
    attendanceType: record.attendanceType ?? "BALCAO",
    priority: record.priority,
    status: record.status,
    requesterName: record.requesterName,
    requesterEmail: record.requesterEmail ?? undefined,
    clientId: record.clientId,
    clientName: record.client.name,
    assigneeId: record.assigneeId ?? undefined,
    assigneeName: record.assignee?.name ?? undefined,
    openedByName: record.openedBy.name,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    resolvedAt: record.resolvedAt?.toISOString() ?? undefined,
    closedAt: record.closedAt?.toISOString() ?? undefined,
    closingReason: record.closingReason ?? undefined,
    checkedInAt: record.checkedInAt?.toISOString() ?? undefined,
    checkedOutAt: record.checkedOutAt?.toISOString() ?? undefined,
    waitingPartsStartedAt: record.waitingPartsStartedAt?.toISOString() ?? undefined,
    slaWaitingPartsMs: record.slaWaitingPartsMs,
    history: record.history.map(mapTicketHistory),
    attachments: (record.attachments ?? []).map(mapTicketAttachment),
    expenses: (record.expenses ?? []).map(mapExpense),
    billing: record.billing
      ? mapTicketBilling(
          record.billing,
          (record.serviceOrders ?? [])
            .filter((os) => os.status === "COMPLETED")
            .map((os) => {
              const laborAmount = os.servicePrice ? Number(os.servicePrice.toNumber()) : 0;
              const partsAmount = (os.parts ?? []).reduce(
                (s, p) => s + p.unitPrice.toNumber() * p.quantity.toNumber(),
                0
              );
              return {
                osId: os.id,
                osNumber: os.number,
                laborAmount: Number(laborAmount.toFixed(2)),
                partsAmount: Number(partsAmount.toFixed(2)),
                totalAmount: Number((laborAmount + partsAmount).toFixed(2))
              };
            })
        )
      : undefined,
    serviceOrders: (record.serviceOrders ?? []).map(mapServiceOrder)
  };
}

export function mapSaleItem(record: SaleItemRecord): SaleItem {
  return {
    id: record.id,
    saleId: record.saleId,
    partCatalogItemId: record.partCatalogItemId,
    partName: record.partName,
    partCode: record.partCode ?? undefined,
    quantity: record.quantity.toNumber(),
    unitPrice: record.unitPrice.toNumber(),
    totalPrice: record.totalPrice.toNumber()
  };
}

export function mapSale(record: SaleRecord): Sale {
  return {
    id: record.id,
    number: record.number,
    clientId: record.clientId,
    clientName: record.client.name,
    financialStatus: record.financialStatus,
    paymentMethod: record.paymentMethod ?? undefined,
    paymentDate: record.paymentDate?.toISOString() ?? undefined,
    paymentReference: record.paymentReference ?? undefined,
    internalNotes: record.internalNotes ?? undefined,
    deliveryFee: record.deliveryFee?.toNumber() ?? 0,
    totalAmount: record.totalAmount.toNumber(),
    paidAt: record.paidAt?.toISOString() ?? undefined,
    canceledAt: record.canceledAt?.toISOString() ?? undefined,
    cancellationReason: record.cancellationReason ?? undefined,
    createdById: record.createdById,
    createdByName: record.createdBy.name,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    items: record.items.map(mapSaleItem)
  };
}

export function mapExpense(record: ExpenseRecord): Expense {
  return {
    id: record.id,
    description: record.description,
    category: record.category,
    amount: record.amount.toNumber(),
    status: record.status,
    expenseDate: record.expenseDate.toISOString(),
    paidAt: record.paidAt?.toISOString() ?? undefined,
    paymentMethod: record.paymentMethod ?? undefined,
    notes: record.notes ?? undefined,
    ticketId: record.ticketId ?? undefined,
    ticketNumber: record.ticket?.number ?? undefined,
    ticketTitle: record.ticket?.title ?? undefined,
    recurringExpenseId: record.recurringExpenseId ?? undefined,
    referenceMonth: record.referenceMonth ?? undefined,
    referenceYear: record.referenceYear ?? undefined,
    createdById: record.createdById,
    createdByName: record.createdBy.name,
    cancellationReason: record.cancellationReason ?? undefined,
    canceledAt: record.canceledAt?.toISOString() ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export function mapPaymentInstruction(record: PaymentInstructionRecord): PaymentInstruction {
  return {
    id: record.id,
    clientId: record.clientId ?? undefined,
    title: record.title,
    paymentChannel: record.paymentChannel,
    pixKey: record.pixKey ?? undefined,
    pixCopyPaste: record.pixCopyPaste ?? undefined,
    qrCodeImagePath: record.qrCodeImagePath ?? undefined,
    bankName: record.bankName ?? undefined,
    bankAgency: record.bankAgency ?? undefined,
    bankAccount: record.bankAccount ?? undefined,
    accountHolder: record.accountHolder ?? undefined,
    accountDocument: record.accountDocument ?? undefined,
    notes: record.notes ?? undefined,
    active: record.active,
    sortOrder: record.sortOrder,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export function mapFiscalDocumentLink(record: FiscalDocumentLinkRecord): FiscalDocumentLink {
  return {
    id: record.id,
    ticketId: record.ticketId ?? undefined,
    saleId: record.saleId ?? undefined,
    monthlyBillingId: record.monthlyBillingId ?? undefined,
    rentalBillingId: record.rentalBillingId ?? undefined,
    label: record.label ?? undefined,
    createdAt: record.createdAt.toISOString()
  };
}

export function mapFiscalDocument(record: FiscalDocumentRecord): FiscalDocument {
  return {
    id: record.id,
    clientId: record.clientId,
    type: record.type,
    number: record.number,
    series: record.series ?? undefined,
    issueDate: record.issueDate.toISOString(),
    totalAmount: record.totalAmount?.toNumber() ?? undefined,
    fileName: record.fileName,
    filePath: record.filePath,
    notes: record.notes ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    links: record.links.map(mapFiscalDocumentLink)
  };
}

interface ClientContractRecord {
  id: string;
  clientId: string;
  contractNumber: string;
  startDate: Date;
  endDate: Date | null;
  status: ClientContract["status"];
  coverageType: ClientContract["coverageType"];
  monthlyValue: PrismaDecimalLike | null;
  coveredCategories: string[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function mapClientContract(record: ClientContractRecord): ClientContract {
  return {
    id: record.id,
    clientId: record.clientId,
    contractNumber: record.contractNumber,
    startDate: record.startDate.toISOString(),
    endDate: record.endDate?.toISOString() ?? undefined,
    status: record.status,
    coverageType: record.coverageType,
    monthlyValue: record.monthlyValue?.toNumber() ?? undefined,
    coveredCategories: record.coveredCategories,
    notes: record.notes ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export function mapStockMovement(record: StockMovementRecord): StockMovement {
  return {
    id: record.id,
    partCatalogItemId: record.partCatalogItemId,
    partName: record.part.name,
    type: record.type,
    quantity: record.quantity.toNumber(),
    saleId: record.saleId ?? undefined,
    serviceOrderPartId: record.serviceOrderPartId ?? undefined,
    notes: record.notes ?? undefined,
    createdByName: record.createdBy.name,
    createdAt: record.createdAt.toISOString()
  };
}

export const saleInclude = {
  client: true,
  createdBy: true,
  items: { orderBy: { createdAt: "asc" as const } }
} as const;

export const expenseInclude = {
  createdBy: true,
  ticket: {
    select: {
      id: true,
      number: true,
      title: true
    }
  }
} as const;

interface TicketCategoryRecord {
  id: string;
  name: string;
  label: string;
  suggestedRole: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export function mapTicketCategory(record: TicketCategoryRecord): TicketCategory {
  return {
    id: record.id,
    name: record.name,
    label: record.label,
    suggestedRole: (record.suggestedRole as TicketCategory["suggestedRole"]) ?? undefined,
    active: record.active,
    sortOrder: record.sortOrder,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export const serviceOrderInclude = {
  assignedTechnician: true,
  createdBy: true,
  parts: {
    orderBy: {
      createdAt: "asc"
    }
  }
} as const;

export const serviceOrderIncludeWithoutParts = {
  assignedTechnician: true,
  createdBy: true
} as const;

export const ticketBillingInclude = {
  entries: {
    include: {
      createdBy: true
    },
    orderBy: {
      createdAt: "asc"
    }
  },
  history: {
    include: {
      author: true
    },
    orderBy: {
      createdAt: "desc"
    }
  }
} as const;

export const ticketIncludeWithoutServiceOrders = {
  client: true,
  assignee: true,
  openedBy: true,
  history: {
    include: {
      author: true
    },
    orderBy: {
      createdAt: "asc"
    }
  },
  attachments: {
    orderBy: {
      createdAt: "desc"
    }
  },
  expenses: {
    include: expenseInclude,
    orderBy: {
      expenseDate: "desc"
    }
  },
  billing: {
    include: {
      entries: {
        include: {
          createdBy: true
        },
        orderBy: {
          createdAt: "asc"
        }
      },
      history: {
        include: {
          author: true
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  }
} as const;

export const ticketInclude = {
  client: true,
  assignee: true,
  openedBy: true,
  history: {
    include: {
      author: true
    },
    orderBy: {
      createdAt: "asc"
    }
  },
  attachments: {
    orderBy: {
      createdAt: "desc"
    }
  },
  expenses: {
    include: expenseInclude,
    orderBy: {
      expenseDate: "desc"
    }
  },
  serviceOrders: {
    include: serviceOrderInclude,
    orderBy: {
      createdAt: "desc"
    }
  },
  billing: {
    include: {
      entries: {
        include: {
          createdBy: true
        },
        orderBy: {
          createdAt: "asc"
        }
      },
      history: {
        include: {
          author: true
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  }
} as const;

export const ticketIncludeWithoutServiceOrderParts = {
  client: true,
  assignee: true,
  openedBy: true,
  history: {
    include: {
      author: true
    },
    orderBy: {
      createdAt: "asc"
    }
  },
  attachments: {
    orderBy: {
      createdAt: "desc"
    }
  },
  expenses: {
    include: expenseInclude,
    orderBy: {
      expenseDate: "desc"
    }
  },
  serviceOrders: {
    include: serviceOrderIncludeWithoutParts,
    orderBy: {
      createdAt: "desc"
    }
  },
  billing: {
    include: {
      entries: {
        include: {
          createdBy: true
        },
        orderBy: {
          createdAt: "asc"
        }
      },
      history: {
        include: {
          author: true
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  }
} as const;

// ── Rental module ─────────────────────────────────────────────────────────────

interface EquipmentRecord {
  id: string;
  model: string;
  serialNumber: string | null;
  patrimonyCode: string | null;
  status: Equipment["status"];
  isReserve: boolean;
  purchaseDate: Date | null;
  purchaseCost: PrismaDecimalLike | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface EquipmentLoanRecord {
  id: string;
  reserveEquipmentId: string;
  reserveEquipment: { model: string; patrimonyCode: string | null };
  mainEquipmentId: string | null;
  mainEquipment: { model: string; patrimonyCode: string | null } | null;
  clientId: string;
  client: { name: string };
  loanedAt: Date;
  returnedAt: Date | null;
  notes: string | null;
  createdAt: Date;
}

interface RentalContractItemRecord {
  id: string;
  rentalContractId: string;
  equipmentId: string;
  equipment: { model: string; serialNumber: string | null };
  monthlyPrice: PrismaDecimalLike;
  installedAt: Date;
  returnedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface RentalBillingRecord {
  id: string;
  rentalContractId: string;
  clientId: string;
  client: { name: string };
  referenceMonth: number;
  referenceYear: number;
  amount: PrismaDecimalLike;
  dueDate: Date | null;
  financialStatus: RentalBilling["financialStatus"];
  paymentMethod: string | null;
  paymentDate: Date | null;
  paymentReference: string | null;
  paidAt: Date | null;
  canceledAt: Date | null;
  notes: string | null;
  createdBy: { name: string };
  createdAt: Date;
  updatedAt: Date;
}

interface RentalContractRecord {
  id: string;
  contractNumber: string;
  clientId: string;
  client: { name: string };
  status: RentalContract["status"];
  startDate: Date;
  endDate: Date | null;
  noticeDays: number;
  totalMonthlyValue: PrismaDecimalLike;
  notes: string | null;
  createdBy: { name: string };
  createdAt: Date;
  updatedAt: Date;
  items: RentalContractItemRecord[];
  billings: RentalBillingRecord[];
}

export function mapEquipment(r: EquipmentRecord): Equipment {
  return {
    id: r.id,
    model: r.model,
    serialNumber: r.serialNumber ?? undefined,
    patrimonyCode: r.patrimonyCode ?? undefined,
    status: r.status,
    isReserve: r.isReserve,
    purchaseDate: r.purchaseDate?.toISOString(),
    purchaseCost: r.purchaseCost?.toNumber(),
    notes: r.notes ?? undefined,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString()
  };
}

export function mapEquipmentLoan(r: EquipmentLoanRecord): EquipmentLoan {
  const now = new Date();
  const end = r.returnedAt ?? now;
  const daysOnLoan = Math.floor((end.getTime() - r.loanedAt.getTime()) / 86_400_000);
  return {
    id: r.id,
    reserveEquipmentId: r.reserveEquipmentId,
    reserveEquipmentModel: r.reserveEquipment.model,
    reserveEquipmentPatrimony: r.reserveEquipment.patrimonyCode ?? undefined,
    mainEquipmentId: r.mainEquipmentId ?? undefined,
    mainEquipmentModel: r.mainEquipment?.model,
    mainEquipmentPatrimony: r.mainEquipment?.patrimonyCode ?? undefined,
    clientId: r.clientId,
    clientName: r.client.name,
    loanedAt: r.loanedAt.toISOString(),
    returnedAt: r.returnedAt?.toISOString(),
    daysOnLoan,
    notes: r.notes ?? undefined,
    createdAt: r.createdAt.toISOString()
  };
}

export function mapRentalContractItem(r: RentalContractItemRecord): RentalContractItem {
  return {
    id: r.id,
    rentalContractId: r.rentalContractId,
    equipmentId: r.equipmentId,
    equipmentModel: r.equipment.model,
    equipmentSerialNumber: r.equipment.serialNumber ?? undefined,
    monthlyPrice: r.monthlyPrice.toNumber(),
    installedAt: r.installedAt.toISOString(),
    returnedAt: r.returnedAt?.toISOString(),
    notes: r.notes ?? undefined,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString()
  };
}

export function mapRentalBilling(r: RentalBillingRecord): RentalBilling {
  return {
    id: r.id,
    rentalContractId: r.rentalContractId,
    clientId: r.clientId,
    clientName: r.client.name,
    referenceMonth: r.referenceMonth,
    referenceYear: r.referenceYear,
    amount: r.amount.toNumber(),
    dueDate: r.dueDate?.toISOString(),
    financialStatus: r.financialStatus,
    paymentMethod: r.paymentMethod ?? undefined,
    paymentDate: r.paymentDate?.toISOString(),
    paymentReference: r.paymentReference ?? undefined,
    paidAt: r.paidAt?.toISOString(),
    canceledAt: r.canceledAt?.toISOString(),
    notes: r.notes ?? undefined,
    createdByName: r.createdBy.name,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString()
  };
}

export function mapRentalContract(r: RentalContractRecord): RentalContract {
  return {
    id: r.id,
    contractNumber: r.contractNumber,
    clientId: r.clientId,
    clientName: r.client.name,
    status: r.status,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate?.toISOString(),
    noticeDays: r.noticeDays,
    totalMonthlyValue: r.totalMonthlyValue.toNumber(),
    notes: r.notes ?? undefined,
    createdByName: r.createdBy.name,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    items: r.items.map(mapRentalContractItem),
    billings: r.billings.map(mapRentalBilling)
  };
}

export const rentalContractInclude = {
  client: true,
  createdBy: true,
  items: {
    include: { equipment: true },
    orderBy: { installedAt: "asc" as const }
  },
  billings: {
    include: { client: true, createdBy: true },
    orderBy: [{ referenceYear: "desc" as const }, { referenceMonth: "desc" as const }]
  }
};
