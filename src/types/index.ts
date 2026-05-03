export type UserRole = "ADMIN" | "ATTENDANT" | "TECHNICIAN";

export type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_CUSTOMER"
  | "RESOLVED"
  | "CLOSED"
  | "CANCELED";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type HistoryEventType =
  | "COMMENT"
  | "STATUS_CHANGE"
  | "PRIORITY_CHANGE"
  | "ASSIGNEE_CHANGE"
  | "CREATED"
  | "CLOSED"
  | "REOPENED";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}

export interface Client {
  id: string;
  name: string;
  document?: string;
  contactName: string;
  email?: string;
  phone?: string;
  notes?: string;
  active: boolean;
  ticketCount: number;
}

export interface TicketHistoryItem {
  id: string;
  ticketId: string;
  authorName: string;
  eventType: HistoryEventType;
  message: string;
  createdAt: string;
}

export interface TicketAttachment {
  id: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface Ticket {
  id: string;
  number: string;
  title: string;
  description: string;
  category?: string;
  priority: TicketPriority;
  status: TicketStatus;
  requesterName: string;
  requesterEmail?: string;
  clientId: string;
  clientName: string;
  assigneeId?: string;
  assigneeName?: string;
  openedByName: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  closingReason?: string;
  history: TicketHistoryItem[];
  attachments: TicketAttachment[];
}

export interface DashboardSummary {
  open: number;
  inProgress: number;
  waitingCustomer: number;
  closed: number;
}

export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
