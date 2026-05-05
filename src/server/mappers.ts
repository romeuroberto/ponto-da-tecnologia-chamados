import type {
  AppUser,
  BillingEntry,
  BillingHistoryItem,
  Client,
  ClientBillingProfile,
  CompanyProfile,
  FiscalDocument,
  FiscalDocumentLink,
  PaymentInstruction,
  Sale,
  SaleItem,
  ServiceOrderPart,
  ServiceOrder,
  StockMovement,
  Ticket,
  TicketAttachment,
  TicketBilling,
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
  hasActiveContract: boolean;
  contractNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
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
  client: ClientRecord;
  assignee: UserRecord | null;
  openedBy: UserRecord;
  history: TicketHistoryRecord[];
  attachments?: TicketAttachmentRecord[];
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
    active: record.active,
    ticketCount: record._count?.tickets ?? 0,
    billingProfile: record.billingProfile ? mapClientBillingProfile(record.billingProfile) : undefined
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

export function mapTicketBilling(record: TicketBillingRecord): TicketBilling {
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
    history: record.history.map(mapBillingHistory)
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
    hasActiveContract: record.hasActiveContract,
    contractNotes: record.contractNotes ?? undefined,
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
    history: record.history.map(mapTicketHistory),
    attachments: (record.attachments ?? []).map(mapTicketAttachment),
    billing: record.billing ? mapTicketBilling(record.billing) : undefined,
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
