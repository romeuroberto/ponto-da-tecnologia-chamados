export type UserRole = "ADMIN" | "ATTENDANT" | "TECHNICIAN";

export type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_CUSTOMER"
  | "RESOLVED"
  | "CLOSED"
  | "CANCELED";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TicketAttendanceType = "REMOTE" | "INTERNAL" | "IN_STORE_EQUIPMENT" | "FIELD_VISIT";

export type BillingType = "AVULSO" | "CONTRATO" | "GARANTIA" | "CORTESIA";

export type FinancialStatus = "PENDENTE" | "EM_ANALISE" | "APROVADO" | "FATURADO" | "PAGO" | "CANCELADO";

export type BillingEntryType = "LABOR" | "PART" | "TRAVEL" | "EXTRA";

export type BillingHistoryEventType =
  | "SUMMARY_UPDATED"
  | "ENTRY_CREATED"
  | "ENTRY_UPDATED"
  | "ENTRY_DELETED"
  | "STATUS_UPDATED";

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
  billingProfile?: ClientBillingProfile;
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

export interface BillingEntry {
  id: string;
  ticketBillingId: string;
  entryType: BillingEntryType;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  billable: boolean;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingHistoryItem {
  id: string;
  ticketBillingId: string;
  authorName: string;
  eventType: BillingHistoryEventType;
  message: string;
  createdAt: string;
}

export interface TicketBilling {
  id: string;
  ticketId: string;
  billingType: BillingType;
  financialStatus: FinancialStatus;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  internalNotes?: string;
  approvedAt?: string;
  invoicedAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  entries: BillingEntry[];
  history: BillingHistoryItem[];
}

export interface ClientBillingProfile {
  id: string;
  clientId: string;
  defaultBillingType: BillingType;
  hourlyRate?: number;
  travelRate?: number;
  defaultDiscountPercent?: number;
  hasActiveContract: boolean;
  contractNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  number: string;
  title: string;
  description: string;
  category?: string;
  attendanceType: TicketAttendanceType;
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
  billing?: TicketBilling;
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
