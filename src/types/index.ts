export type UserRole = "ADMIN" | "ATTENDANT" | "TECHNICIAN" | "CLIENT";

export type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_CUSTOMER"
  | "WAITING_PARTS"
  | "CLOSED"
  | "CANCELED";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TicketAttendanceType = "REMOTE" | "BALCAO" | "IN_STORE_EQUIPMENT" | "FIELD_VISIT";

export type ServiceOrderStatus = "PLANNED" | "IN_EXECUTION" | "PAUSED" | "COMPLETED" | "CANCELED";

export type BillingType = "AVULSO" | "CONTRATO" | "GARANTIA" | "CORTESIA";

export type ContractStatus = "RASCUNHO" | "ATIVO" | "ENCERRADO" | "EXPIRADO";
export type ContractCoverageType = "TOTAL" | "PARCIAL";

export type FinancialStatus = "PENDENTE" | "EM_ANALISE" | "APROVADO" | "FATURADO" | "PAGO" | "CANCELADO";

export type ExpenseStatus = "PENDENTE" | "PAGA" | "CANCELADA";

export type RecurringFrequency = "MENSAL" | "BIMESTRAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL";

export type ExpenseCategory =
  | "ALUGUEL"
  | "ENERGIA"
  | "INTERNET"
  | "TRANSPORTE"
  | "COMBUSTIVEL"
  | "ALIMENTACAO"
  | "PECAS_INSUMOS"
  | "FERRAMENTAS_EQUIPAMENTOS"
  | "IMPOSTOS_TAXAS"
  | "SERVICOS_TERCEIROS"
  | "OUTROS";

export type BillingEntryType = "LABOR" | "PART" | "TRAVEL" | "EXTRA" | "CONSULTING" | "REMOTE_SUPPORT";

export interface OsContribution {
  osId: string;
  osNumber: string;
  laborAmount: number;
  partsAmount: number;
  totalAmount: number;
}
export type FiscalDocumentType = "NFSE" | "NFE" | "RECIBO" | "OUTRO";

export type BillingHistoryEventType =
  | "SUMMARY_UPDATED"
  | "ENTRY_CREATED"
  | "ENTRY_UPDATED"
  | "ENTRY_DELETED"
  | "STATUS_UPDATED";

export type StockMovementType = "ENTRY" | "SALE_EXIT" | "SERVICE_ORDER_EXIT" | "ADJUSTMENT";

export type EquipmentStatus = "DISPONIVEL" | "LOCADO" | "MANUTENCAO" | "BAIXADO";
export type RentalContractStatus = "RASCUNHO" | "ATIVO" | "ENCERRADO" | "EXPIRADO";

export type HistoryEventType =
  | "COMMENT"
  | "STATUS_CHANGE"
  | "PRIORITY_CHANGE"
  | "ASSIGNEE_CHANGE"
  | "CREATED"
  | "CLOSED"
  | "REOPENED";

export interface TicketCategory {
  id: string;
  name: string;
  label: string;
  suggestedRole?: "ATTENDANT" | "TECHNICIAN";
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

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
  isReseller: boolean;
  active: boolean;
  ticketCount: number;
  billingProfile?: ClientBillingProfile;
}

export interface CompanyProfile {
  id: string;
  legalName: string;
  tradeName?: string;
  document: string;
  stateRegistration?: string;
  municipalRegistration?: string;
  financialEmail?: string;
  phone?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  notes?: string;
  logoPath?: string;
  signaturePath?: string;
  createdAt: string;
  updatedAt: string;
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

export interface ServiceCatalogItem {
  id: string;
  name: string;
  code?: string;
  description?: string;
  defaultPrice: number;
  resalePrice?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PartCatalogItem {
  id: string;
  name: string;
  code?: string;
  description?: string;
  unit: string;
  costPrice: number;
  unitPrice: number;
  resalePrice?: number;
  stockQuantity: number;
  minimumStock?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  partCatalogItemId: string;
  partName: string;
  type: StockMovementType;
  quantity: number;
  saleId?: string;
  serviceOrderPartId?: string;
  notes?: string;
  createdByName: string;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  partCatalogItemId: string;
  partName: string;
  partCode?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Sale {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  financialStatus: FinancialStatus;
  paymentMethod?: string;
  paymentDate?: string;
  paymentReference?: string;
  internalNotes?: string;
  deliveryFee: number;
  totalAmount: number;
  paidAt?: string;
  canceledAt?: string;
  cancellationReason?: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  items: SaleItem[];
}

export interface RecurringExpense {
  id: string;
  description: string;
  category: ExpenseCategory;
  baseAmount: number;
  paymentMethod?: string;
  frequency: RecurringFrequency;
  dayOfMonth: number;
  startDate: string;
  endDate?: string;
  active: boolean;
  notes?: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  status: ExpenseStatus;
  expenseDate: string;
  paidAt?: string;
  paymentMethod?: string;
  notes?: string;
  ticketId?: string;
  ticketNumber?: string;
  ticketTitle?: string;
  recurringExpenseId?: string;
  referenceMonth?: number;
  referenceYear?: number;
  createdById: string;
  createdByName: string;
  cancellationReason?: string;
  canceledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentInstruction {
  id: string;
  clientId?: string;
  title: string;
  paymentChannel: string;
  pixKey?: string;
  pixCopyPaste?: string;
  qrCodeImagePath?: string;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  accountHolder?: string;
  accountDocument?: string;
  notes?: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface FiscalDocumentLink {
  id: string;
  ticketId?: string;
  saleId?: string;
  label?: string;
  createdAt: string;
}

export interface FiscalDocument {
  id: string;
  clientId: string;
  type: FiscalDocumentType;
  number: string;
  series?: string;
  issueDate: string;
  totalAmount?: number;
  fileName: string;
  filePath: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  links: FiscalDocumentLink[];
}

export interface ServiceOrderPart {
  id: string;
  serviceOrderId: string;
  partCatalogItemId: string;
  partName: string;
  partCode?: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrder {
  id: string;
  ticketId: string;
  number: string;
  status: ServiceOrderStatus;
  serviceType?: string;
  servicePrice?: number;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  scheduledStartAt?: string;
  startedAt?: string;
  finishedAt?: string;
  executionNotes?: string;
  customerApprovalName?: string;
  customerApprovalAt?: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  parts: ServiceOrderPart[];
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
  // Faturamento
  invoiceNumber?: string;
  invoiceDueDate?: string;
  // Pagamento
  paymentMethod?: string;
  paymentDate?: string;
  paymentReference?: string;
  // Cancelamento
  cancellationReason?: string;
  // Timestamps de transição
  approvedAt?: string;
  invoicedAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  entries: BillingEntry[];
  history: BillingHistoryItem[];
  // Contribuições automáticas das OSs concluídas (camada 1 — somente leitura)
  osContributions: OsContribution[];
  osContributionsTotal: number;
  // Contrato ativo do cliente (somente leitura)
  activeContract?: ClientContract;
}

export interface ClientContract {
  id: string;
  clientId: string;
  contractNumber: string;
  startDate: string;
  endDate?: string;
  status: ContractStatus;
  coverageType: ContractCoverageType;
  monthlyValue?: number;
  coveredCategories: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientBillingProfile {
  id: string;
  clientId: string;
  defaultBillingType: BillingType;
  hourlyRate?: number;
  travelRate?: number;
  defaultDiscountPercent?: number;
  billingInstructions?: string;
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
  checkedInAt?: string;
  checkedOutAt?: string;
  waitingPartsStartedAt?: string;
  slaWaitingPartsMs: number;
  history: TicketHistoryItem[];
  attachments: TicketAttachment[];
  billing?: TicketBilling;
  expenses?: Expense[];
  serviceOrders: ServiceOrder[];
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

export interface Equipment {
  id: string;
  model: string;
  serialNumber?: string;
  patrimonyCode?: string;
  status: EquipmentStatus;
  purchaseDate?: string;
  purchaseCost?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentalContractItem {
  id: string;
  rentalContractId: string;
  equipmentId: string;
  equipmentModel: string;
  equipmentSerialNumber?: string;
  monthlyPrice: number;
  installedAt: string;
  returnedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentalBilling {
  id: string;
  rentalContractId: string;
  clientId: string;
  clientName: string;
  referenceMonth: number;
  referenceYear: number;
  amount: number;
  dueDate?: string;
  financialStatus: FinancialStatus;
  paymentMethod?: string;
  paymentDate?: string;
  paymentReference?: string;
  paidAt?: string;
  canceledAt?: string;
  notes?: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentalContract {
  id: string;
  contractNumber: string;
  clientId: string;
  clientName: string;
  status: RentalContractStatus;
  startDate: string;
  endDate?: string;
  noticeDays: number;
  totalMonthlyValue: number;
  notes?: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  items: RentalContractItem[];
  billings: RentalBilling[];
}
