import type { AppUser, Client, Ticket, TicketAttachment, TicketHistoryItem } from "@/types";

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
  _count?: {
    tickets: number;
  };
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
}

interface TicketAttachmentRecord {
  id: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
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
    ticketCount: record._count?.tickets ?? 0
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

export function mapTicket(record: TicketRecord): Ticket {
  return {
    id: record.id,
    number: record.number,
    title: record.title,
    description: record.description,
    category: record.category ?? undefined,
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
    attachments: (record.attachments ?? []).map(mapTicketAttachment)
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
  }
} as const;
