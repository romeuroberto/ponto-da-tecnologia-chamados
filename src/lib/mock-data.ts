import type { AppUser, Client, DashboardSummary, Ticket } from "@/types";

export const currentUser: AppUser = {
  id: "u1",
  name: "Mariana Costa",
  email: "mariana@empresa.com",
  role: "ADMIN",
  active: true
};

export const users: AppUser[] = [
  currentUser,
  {
    id: "u2",
    name: "Carlos Souza",
    email: "carlos@empresa.com",
    role: "ATTENDANT",
    active: true
  },
  {
    id: "u3",
    name: "Paulo Lima",
    email: "paulo@empresa.com",
    role: "TECHNICIAN",
    active: true
  }
];

export const clients: Client[] = [
  {
    id: "c1",
    name: "Alfa Contabilidade",
    contactName: "Fernanda Rocha",
    email: "fernanda@alfa.com.br",
    phone: "(11) 98888-1111",
    notes: "Cliente com alta recorrência de suporte remoto.",
    active: true,
    isReseller: false,
    ticketCount: 12
  },
  {
    id: "c2",
    name: "Mercado Central",
    contactName: "Rafael Teles",
    email: "rafael@mercadocentral.com",
    phone: "(11) 97777-2222",
    notes: "Priorizar falhas relacionadas ao caixa.",
    active: true,
    isReseller: false,
    ticketCount: 5
  },
  {
    id: "c3",
    name: "Clínica Vida",
    contactName: "Luciana Prado",
    email: "luciana@clinicavida.com.br",
    phone: "(11) 96666-3333",
    active: true,
    isReseller: false,
    ticketCount: 8
  }
];

export const tickets: Ticket[] = [
  {
    id: "t1",
    number: "CH-2026-001",
    title: "Erro ao emitir nota fiscal",
    description: "O sistema retorna erro ao concluir a emissão da nota fiscal em duas estações.",
    category: "Sistema",
    attendanceType: "REMOTE",
    priority: "CRITICAL",
    status: "IN_PROGRESS",
    requesterName: "Fernanda Rocha",
    requesterEmail: "fernanda@alfa.com.br",
    clientId: "c1",
    clientName: "Alfa Contabilidade",
    assigneeId: "u3",
    assigneeName: "Paulo Lima",
    openedByName: "Carlos Souza",
    createdAt: "2026-04-30T09:15:00.000Z",
    updatedAt: "2026-04-30T11:20:00.000Z",
    slaWaitingPartsMs: 0,
    attachments: [],
    serviceOrders: [],
    history: [
      {
        id: "h1",
        ticketId: "t1",
        authorName: "Carlos Souza",
        eventType: "CREATED",
        message: "Chamado aberto e priorizado como crítico.",
        createdAt: "2026-04-30T09:15:00.000Z"
      },
      {
        id: "h2",
        ticketId: "t1",
        authorName: "Paulo Lima",
        eventType: "COMMENT",
        message: "Análise iniciada. Possível falha na integração fiscal.",
        createdAt: "2026-04-30T11:20:00.000Z"
      }
    ]
  },
  {
    id: "t2",
    number: "CH-2026-002",
    title: "Usuário sem acesso ao e-mail",
    description: "Solicitante não consegue autenticar no Outlook desde o início da manhã.",
    category: "E-mail",
    attendanceType: "BALCAO",
    priority: "HIGH",
    status: "WAITING_CUSTOMER",
    requesterName: "Rafael Teles",
    requesterEmail: "rafael@mercadocentral.com",
    clientId: "c2",
    clientName: "Mercado Central",
    assigneeId: "u2",
    assigneeName: "Carlos Souza",
    openedByName: "Mariana Costa",
    createdAt: "2026-04-30T08:40:00.000Z",
    updatedAt: "2026-04-30T10:05:00.000Z",
    slaWaitingPartsMs: 0,
    attachments: [],
    serviceOrders: [],
    history: [
      {
        id: "h3",
        ticketId: "t2",
        authorName: "Mariana Costa",
        eventType: "CREATED",
        message: "Chamado aberto via atendimento telefônico.",
        createdAt: "2026-04-30T08:40:00.000Z"
      },
      {
        id: "h4",
        ticketId: "t2",
        authorName: "Carlos Souza",
        eventType: "COMMENT",
        message: "Solicitada validação de senha e teste em outro dispositivo.",
        createdAt: "2026-04-30T10:05:00.000Z"
      }
    ]
  },
  {
    id: "t3",
    number: "CH-2026-003",
    title: "Instalação de impressora",
    description: "Necessário configurar uma nova impressora no setor financeiro.",
    category: "Infraestrutura",
    attendanceType: "FIELD_VISIT",
    priority: "MEDIUM",
    status: "OPEN",
    requesterName: "Luciana Prado",
    requesterEmail: "luciana@clinicavida.com.br",
    clientId: "c3",
    clientName: "Clínica Vida",
    openedByName: "Carlos Souza",
    createdAt: "2026-04-29T15:10:00.000Z",
    updatedAt: "2026-04-29T15:10:00.000Z",
    slaWaitingPartsMs: 0,
    attachments: [],
    serviceOrders: [],
    history: [
      {
        id: "h5",
        ticketId: "t3",
        authorName: "Carlos Souza",
        eventType: "CREATED",
        message: "Chamado aguardando atribuição.",
        createdAt: "2026-04-29T15:10:00.000Z"
      }
    ]
  }
];

export const dashboardSummary: DashboardSummary = {
  open: 8,
  inProgress: 5,
  waitingCustomer: 3,
  closed: 27
};

export function getTicketById(id: string) {
  return tickets.find((ticket) => ticket.id === id);
}

export function getClientById(id: string) {
  return clients.find((client) => client.id === id);
}

export function getUserById(id: string) {
  return users.find((user) => user.id === id);
}

