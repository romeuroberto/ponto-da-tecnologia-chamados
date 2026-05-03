import type { AppUser, BillingEntry, BillingHistoryItem, Client, ClientBillingProfile, Ticket, TicketAttachment, TicketBilling, TicketHistoryItem } from "@/types";

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

interface TicketHistoryRecord {
  id: string;
  ticketId: string;
  eventType: TicketHistoryItem["eventType"];
  message: string;
  createdAt: Date;
  author: UserRecord;
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
  client: ClientRecord;
  assignee: UserRecord | null;
  openedBy: UserRecord;
  history: TicketHistoryRecord[];
  attachments?: TicketAttachmentRecord[];
  billing?: TicketBillingRecord | null;
}

interface TicketAttachmentRecord {
  id: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
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
    phone: record.phone ?? undefined,
    notes: record.notes ?? undefined,
    active: record.active,
    ticketCount: record._count?.tickets ?? 0,
    billingProfile: record.billingProfile ? mapClientBillingProfile(record.billingProfile) : undefined
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
    attendanceType: record.attendanceType ?? "INTERNAL",
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
    history: record.history.map(mapTicketHistory),
    attachments: (record.attachments ?? []).map(mapTicketAttachment),
    billing: record.billing ? mapTicketBilling(record.billing) : undefined
  };
}

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
