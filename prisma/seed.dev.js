const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const attachmentLibrary = [
  {
    fileName: "erro-nf-log.txt",
    filePath: "/uploads/tickets/seed-attachments/erro-nf-log.txt",
    mimeType: "text/plain",
    sizeBytes: 2048
  },
  {
    fileName: "mapa-servidor-arquivos.txt",
    filePath: "/uploads/tickets/seed-attachments/mapa-servidor-arquivos.txt",
    mimeType: "text/plain",
    sizeBytes: 1536
  },
  {
    fileName: "analise-consulta-bd.txt",
    filePath: "/uploads/tickets/seed-attachments/analise-consulta-bd.txt",
    mimeType: "text/plain",
    sizeBytes: 3072
  },
  {
    fileName: "passos-vpn.pdf",
    filePath: "/uploads/tickets/seed-attachments/passos-vpn.pdf",
    mimeType: "application/pdf",
    sizeBytes: 4096
  }
];

const clientSeedData = [
  {
    name: "Alfa Contabilidade",
    contactName: "Fernanda Rocha",
    email: "fernanda@alfa.com.br",
    phone: "(11) 98888-1111",
    notes: "Cliente com alta recorrencia de suporte remoto.",
    billingProfile: {
      defaultBillingType: "CONTRATO",
      hourlyRate: 180,
      travelRate: 90,
      defaultDiscountPercent: 8,
      hasActiveContract: true,
      contractNotes: "Contrato mensal com franquia reduzida para visitas presenciais."
    }
  },
  {
    name: "Mercado Central",
    contactName: "Rafael Teles",
    email: "rafael@mercadocentral.com",
    phone: "(11) 97777-2222",
    notes: "Priorizar falhas relacionadas ao caixa.",
    billingProfile: {
      defaultBillingType: "AVULSO",
      hourlyRate: 210,
      travelRate: 120,
      defaultDiscountPercent: 0,
      hasActiveContract: false,
      contractNotes: "Atendimentos cobrados por hora com deslocamento separado."
    }
  },
  {
    name: "Clinica Vida",
    contactName: "Luciana Prado",
    email: "luciana@clinicavida.com.br",
    phone: "(11) 96666-3333",
    billingProfile: {
      defaultBillingType: "CONTRATO",
      hourlyRate: 165,
      travelRate: 75,
      defaultDiscountPercent: 5,
      hasActiveContract: true,
      contractNotes: "Contrato com desconto padrao para ajustes pequenos."
    }
  },
  {
    name: "TransLog Express",
    contactName: "Bruno Salles",
    email: "bruno@translog.com.br",
    phone: "(11) 95555-4444",
    notes: "Opera 24x7 e depende fortemente do sistema de rastreio.",
    billingProfile: {
      defaultBillingType: "AVULSO",
      hourlyRate: 240,
      travelRate: 140,
      defaultDiscountPercent: 0,
      hasActiveContract: false,
      contractNotes: "Cliente sensivel a incidentes criticos fora do horario."
    }
  },
  {
    name: "Escola Horizonte",
    contactName: "Patricia Nogueira",
    email: "patricia@escolahorizonte.com.br",
    phone: "(11) 94444-5555",
    billingProfile: {
      defaultBillingType: "CONTRATO",
      hourlyRate: 155,
      travelRate: 70,
      defaultDiscountPercent: 10,
      hasActiveContract: true,
      contractNotes: "Chamados academicos com maior volume em inicio de semestre."
    }
  },
  {
    name: "Oficina Master Car",
    contactName: "Diego Araujo",
    email: "diego@mastercar.com.br",
    phone: "(11) 93333-6666",
    billingProfile: {
      defaultBillingType: "AVULSO",
      hourlyRate: 175,
      travelRate: 95,
      defaultDiscountPercent: 0,
      hasActiveContract: false,
      contractNotes: "Atendimentos pontuais de hardware e impressao."
    }
  },
  {
    name: "Hotel Costa Azul",
    contactName: "Sandra Melo",
    email: "sandra@hotelcostaazul.com.br",
    phone: "(11) 92222-1111",
    notes: "Ambiente com recepcao 24h.",
    billingProfile: {
      defaultBillingType: "CONTRATO",
      hourlyRate: 195,
      travelRate: 100,
      defaultDiscountPercent: 6,
      hasActiveContract: true,
      contractNotes: "Cobertura de plantao remoto durante madrugadas."
    }
  },
  {
    name: "Farmacia Bem Estar",
    contactName: "Tania Duarte",
    email: "tania@farmaciabemestar.com.br",
    phone: "(11) 91111-2222",
    billingProfile: {
      defaultBillingType: "GARANTIA",
      hourlyRate: 0,
      travelRate: 0,
      defaultDiscountPercent: 100,
      hasActiveContract: false,
      contractNotes: "Itens em garantia para PDV e impressoras fiscais."
    }
  },
  {
    name: "Construtora Horizonte Sul",
    contactName: "Andre Matos",
    email: "andre@horizontesul.com.br",
    phone: "(11) 90000-3333",
    billingProfile: {
      defaultBillingType: "AVULSO",
      hourlyRate: 230,
      travelRate: 150,
      defaultDiscountPercent: 3,
      hasActiveContract: false,
      contractNotes: "Visitas in loco frequentes para canteiros."
    }
  },
  {
    name: "Studio Forma",
    contactName: "Camila Viana",
    email: "camila@studioforma.com.br",
    phone: "(11) 98800-4444",
    billingProfile: {
      defaultBillingType: "CORTESIA",
      hourlyRate: 0,
      travelRate: 0,
      defaultDiscountPercent: 100,
      hasActiveContract: false,
      contractNotes: "Primeiro mes de onboarding com suporte de cortesia."
    }
  },
  {
    name: "Academia Pulse",
    contactName: "Leandro Pires",
    email: "leandro@academiapulse.com.br",
    phone: "(11) 97700-5555",
    billingProfile: {
      defaultBillingType: "CONTRATO",
      hourlyRate: 170,
      travelRate: 85,
      defaultDiscountPercent: 7,
      hasActiveContract: true,
      contractNotes: "Contrato cobre suporte remoto e pequenos reparos."
    }
  },
  {
    name: "Juridico Oliveira & Prado",
    contactName: "Renata Oliveira",
    email: "renata@oliveiraprado.adv.br",
    phone: "(11) 96600-6666",
    billingProfile: {
      defaultBillingType: "AVULSO",
      hourlyRate: 220,
      travelRate: 100,
      defaultDiscountPercent: 4,
      hasActiveContract: false,
      contractNotes: "Cliente com demandas de acesso seguro e documentos."
    }
  }
];

const issueTemplates = [
  {
    title: "Erro ao emitir nota fiscal",
    category: "Sistema",
    description: "O sistema retorna erro ao concluir a emissao da nota fiscal em uma ou mais estacoes."
  },
  {
    title: "Usuario sem acesso ao e-mail",
    category: "E-mail",
    description: "Solicitante nao consegue autenticar no Outlook ou webmail desde o inicio do turno."
  },
  {
    title: "Instalacao de impressora no financeiro",
    category: "Infraestrutura",
    description: "Necessario configurar uma nova impressora no setor financeiro e validar impressao."
  },
  {
    title: "Servidor de arquivos indisponivel",
    category: "Infraestrutura",
    description: "Usuarios nao conseguem acessar a pasta compartilhada principal e subpastas do setor."
  },
  {
    title: "Cadastro nao salva no sistema",
    category: "Sistema",
    description: "Formulario trava ao concluir novo cadastro e o registro nao fica persistido."
  },
  {
    title: "Computador da recepcao lento",
    category: "Hardware",
    description: "Equipamento apresenta lentidao severa na abertura de programas e no login."
  },
  {
    title: "Erro no caixa ao fechar venda",
    category: "PDV",
    description: "Terminal retorna mensagem de integracao pendente ao finalizar pagamento."
  },
  {
    title: "VPN nao conecta para home office",
    category: "Rede",
    description: "Colaborador nao consegue estabelecer conexao remota com a empresa."
  },
  {
    title: "Solicitacao de novo usuario no sistema",
    category: "Acesso",
    description: "Criar acesso para colaborador recem-contratado no modulo administrativo."
  },
  {
    title: "Backup noturno com falha",
    category: "Backup",
    description: "Job de backup falhou nas ultimas execucoes e precisa de analise."
  },
  {
    title: "Telefone IP sem audio",
    category: "Telefonia",
    description: "Aparelho liga normalmente, mas nao transmite audio nas ligacoes."
  },
  {
    title: "Erro 500 na intranet",
    category: "Sistema",
    description: "Pagina interna retorna erro 500 ao carregar em navegadores distintos."
  },
  {
    title: "Permissao negada na pasta RH",
    category: "Acesso",
    description: "Gestora perdeu acesso a documentos do setor apos alteracao recente de senha."
  },
  {
    title: "Wi-Fi oscilando no escritorio",
    category: "Rede",
    description: "Conexao sem fio cai em intervalos curtos na area administrativa."
  },
  {
    title: "Solicitacao de instalacao do Office",
    category: "Software",
    description: "Novo computador precisa receber pacote Office e impressoras do setor."
  },
  {
    title: "Monitor nao liga",
    category: "Hardware",
    description: "Estacao permanece sem video apos reinicio e troca basica de cabos."
  },
  {
    title: "Lentidao no banco de dados",
    category: "Banco de dados",
    description: "Consultas do sistema principal estao mais lentas desde a atualizacao."
  },
  {
    title: "Relatorio PDF sai em branco",
    category: "Sistema",
    description: "Modulo financeiro gera arquivo PDF vazio ao exportar para o cliente."
  },
  {
    title: "Cadastro de fornecedor duplicando",
    category: "Sistema",
    description: "Ao salvar, o sistema cria dois registros identicos em vez de um."
  },
  {
    title: "Bloqueio de acesso apos varias tentativas",
    category: "Acesso",
    description: "Usuario foi bloqueado apos tentativas consecutivas de login no portal."
  },
  {
    title: "Atualizacao do antivirus falhou",
    category: "Seguranca",
    description: "Agente do antivirus nao recebe a assinatura mais recente em algumas maquinas."
  },
  {
    title: "Impressora fiscal sem comunicacao",
    category: "PDV",
    description: "Impressora fiscal deixou de responder ao sistema apos troca de bobina."
  },
  {
    title: "Planilha compartilhada nao abre",
    category: "Office",
    description: "Arquivo compartilhado do financeiro acusa bloqueio ou corrupcao ao abrir."
  },
  {
    title: "Acesso remoto expira rapidamente",
    category: "Rede",
    description: "Sessao remota cai poucos minutos apos autenticacao."
  }
];

const statusCycle = ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "CLOSED", "CANCELED"];
const priorityCycle = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const billingTypeCycle = ["AVULSO", "CONTRATO", "GARANTIA", "CORTESIA"];
const financialStatusCycle = ["PENDENTE", "EM_ANALISE", "APROVADO", "FATURADO", "PAGO", "CANCELADO"];
const billingEntryTypeCycle = ["LABOR", "PART", "TRAVEL", "EXTRA"];

function daysAgo(totalDays, hour = 9, minute = 0) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  date.setDate(date.getDate() - totalDays);
  return date;
}

function hoursAfter(baseDate, hours) {
  return new Date(baseDate.getTime() + hours * 60 * 60 * 1000);
}

function minutesAfter(baseDate, minutes) {
  return new Date(baseDate.getTime() + minutes * 60 * 1000);
}

function pad(number) {
  return String(number).padStart(3, "0");
}

function decimal(value) {
  return Number(value.toFixed(2));
}

function pickAttachment(index) {
  const file = attachmentLibrary[index % attachmentLibrary.length];
  return {
    ...file
  };
}

function statusLabel(status) {
  const labels = {
    OPEN: "aberto",
    IN_PROGRESS: "em atendimento",
    WAITING_CUSTOMER: "aguardando cliente",
    CLOSED: "encerrado",
    CANCELED: "cancelado"
  };

  return labels[status];
}

function priorityLabel(priority) {
  const labels = {
    LOW: "baixa",
    MEDIUM: "media",
    HIGH: "alta",
    CRITICAL: "critica"
  };

  return labels[priority];
}

function buildTicketHistory({
  openedById,
  assigneeId,
  status,
  priority,
  createdAt,
  updatedAt,
  title,
  comments
}) {
  const history = [
    {
      authorId: openedById,
      eventType: "CREATED",
      message: `Chamado aberto para ${title.toLowerCase()}.`,
      createdAt
    }
  ];

  if (priority === "HIGH" || priority === "CRITICAL") {
    history.push({
      authorId: openedById,
      eventType: "PRIORITY_CHANGE",
      message: `Prioridade ajustada para ${priorityLabel(priority)} devido ao impacto informado pelo cliente.`,
      previousPriority: priority === "CRITICAL" ? "HIGH" : "MEDIUM",
      nextPriority: priority,
      createdAt: minutesAfter(createdAt, 15)
    });
  }

  if (assigneeId) {
    history.push({
      authorId: openedById,
      eventType: "ASSIGNEE_CHANGE",
      message: "Responsavel definido para o atendimento inicial.",
      createdAt: minutesAfter(createdAt, 30)
    });
  }

  if (status !== "OPEN") {
    history.push({
      authorId: assigneeId ?? openedById,
      eventType: "STATUS_CHANGE",
      message: `Chamado movido para ${statusLabel(status)} durante a triagem.`,
      previousStatus: "OPEN",
      nextStatus: status,
      createdAt: updatedAt
    });
  }

  if (status === "CLOSED") {
    history.push({
      authorId: assigneeId ?? openedById,
      eventType: "CLOSED",
      message: "Chamado encerrado apos confirmacao do cliente.",
      createdAt: minutesAfter(updatedAt, 30)
    });
  }

  comments.forEach((comment, index) => {
    history.push({
      authorId: comment.authorId,
      eventType: "COMMENT",
      message: comment.message,
      createdAt: comment.createdAt ?? minutesAfter(createdAt, 60 + index * 55)
    });
  });

  history.sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  return history;
}

function buildBillingEntries({
  profile,
  financialStatus,
  createdAt,
  createdById,
  includeTravel,
  index
}) {
  const laborHours = decimal(1 + ((index % 5) * 0.5));
  const laborRate = profile?.hourlyRate ? Number(profile.hourlyRate) : 180 + (index % 4) * 20;
  const entries = [
    {
      entryType: "LABOR",
      description: "Horas tecnicas de atendimento e diagnostico.",
      quantity: laborHours,
      unitPrice: decimal(laborRate),
      totalPrice: decimal(laborHours * laborRate),
      billable: financialStatus !== "CORTESIA",
      createdById,
      createdAt,
      updatedAt: minutesAfter(createdAt, 20)
    }
  ];

  if (index % 3 === 0) {
    const partPrice = 45 + (index % 6) * 35;
    entries.push({
      entryType: "PART",
      description: "Peca ou insumo utilizado no atendimento.",
      quantity: 1,
      unitPrice: decimal(partPrice),
      totalPrice: decimal(partPrice),
      billable: true,
      createdById,
      createdAt: minutesAfter(createdAt, 10),
      updatedAt: minutesAfter(createdAt, 25)
    });
  }

  if (includeTravel) {
    const travelRate = profile?.travelRate ? Number(profile.travelRate) : 85 + (index % 3) * 20;
    entries.push({
      entryType: "TRAVEL",
      description: "Deslocamento para atendimento presencial.",
      quantity: 1,
      unitPrice: decimal(travelRate),
      totalPrice: decimal(travelRate),
      billable: true,
      createdById,
      createdAt: minutesAfter(createdAt, 15),
      updatedAt: minutesAfter(createdAt, 30)
    });
  }

  if (index % 4 === 0) {
    const extraPrice = 30 + (index % 5) * 25;
    entries.push({
      entryType: "EXTRA",
      description: "Ajuste complementar ou configuracao adicional.",
      quantity: 1,
      unitPrice: decimal(extraPrice),
      totalPrice: decimal(extraPrice),
      billable: true,
      createdById,
      createdAt: minutesAfter(createdAt, 20),
      updatedAt: minutesAfter(createdAt, 40)
    });
  }

  return entries;
}

function buildFinancialStatus(ticketStatus, index, billingType) {
  if (billingType === "CORTESIA") {
    return index % 2 === 0 ? "PAGO" : "CANCELADO";
  }

  if (billingType === "GARANTIA") {
    return index % 2 === 0 ? "PAGO" : "APROVADO";
  }

  if (ticketStatus === "CLOSED") {
    return index % 3 === 0 ? "PAGO" : "FATURADO";
  }

  if (ticketStatus === "CANCELED") {
    return "CANCELADO";
  }

  return index % 2 === 0 ? "EM_ANALISE" : "PENDENTE";
}

function buildBillingHistory({
  authorId,
  billingType,
  financialStatus,
  createdAt,
  updatedAt,
  entryCount,
  totalAmount
}) {
  const history = [
    {
      authorId,
      eventType: "SUMMARY_UPDATED",
      message: `Resumo financeiro criado com cobranca ${billingType.toLowerCase()}.`,
      createdAt
    }
  ];

  for (let index = 0; index < entryCount; index += 1) {
    history.push({
      authorId,
      eventType: "ENTRY_CREATED",
      message: `Lancamento financeiro ${index + 1} registrado no chamado.`,
      createdAt: minutesAfter(createdAt, 12 + index * 8)
    });
  }

  history.push({
    authorId,
    eventType: "STATUS_UPDATED",
    message: `Status financeiro atualizado para ${financialStatus.toLowerCase()}.`,
    createdAt: updatedAt
  });

  if (financialStatus === "PAGO") {
    history.push({
      authorId,
      eventType: "SUMMARY_UPDATED",
      message: `Recebimento confirmado no valor total de R$ ${totalAmount.toFixed(2)}.`,
      createdAt: minutesAfter(updatedAt, 25)
    });
  }

  return history;
}

async function clearDatabase() {
  await prisma.companyProfile.deleteMany();
  await prisma.fiscalDocumentLink.deleteMany();
  await prisma.fiscalDocument.deleteMany();
  await prisma.paymentInstruction.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.serviceOrderPart.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.partCatalogItem.deleteMany();
  await prisma.serviceCatalogItem.deleteMany();
  await prisma.billingHistory.deleteMany();
  await prisma.billingEntry.deleteMany();
  await prisma.ticketBilling.deleteMany();
  await prisma.ticketHistory.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.clientBillingProfile.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await clearDatabase();

  const defaultPasswordHash = await bcrypt.hash("123456", 10);

  const users = await Promise.all(
    [
      { name: "Mariana Costa", email: "mariana@empresa.com", role: "ADMIN" },
      { name: "Carlos Souza", email: "carlos@empresa.com", role: "ATTENDANT" },
      { name: "Paulo Lima", email: "paulo@empresa.com", role: "TECHNICIAN" },
      { name: "Juliana Mendes", email: "juliana@empresa.com", role: "ATTENDANT" },
      { name: "Ricardo Nunes", email: "ricardo@empresa.com", role: "TECHNICIAN" },
      { name: "Aline Batista", email: "aline@empresa.com", role: "ATTENDANT" },
      { name: "Gustavo Freitas", email: "gustavo@empresa.com", role: "TECHNICIAN" },
      { name: "Bianca Moraes", email: "bianca@empresa.com", role: "ADMIN" }
    ].map((user) =>
      prisma.user.create({
        data: {
          ...user,
          passwordHash: defaultPasswordHash
        }
      })
    )
  );

  const admins = users.filter((user) => user.role === "ADMIN");
  const attendants = users.filter((user) => user.role === "ATTENDANT");
  const technicians = users.filter((user) => user.role === "TECHNICIAN");

  await prisma.companyProfile.create({
    data: {
      legalName: "Ponto da Tecnologia Ltda",
      tradeName: "Ponto da Tecnologia",
      document: "12.345.678/0001-90",
      stateRegistration: "123.456.789.000",
      municipalRegistration: "987654321",
      financialEmail: "financeiro@pontodatecnologia.com.br",
      phone: "(11) 4000-1234",
      website: "https://pontodatecnologia.com.br",
      addressLine1: "Rua das Soluções, 120",
      addressLine2: "Sala 5",
      city: "São Paulo",
      state: "SP",
      postalCode: "01000-000",
      notes: "Perfil institucional seed para o módulo administrativo."
    }
  });

  const clients = await Promise.all(
    clientSeedData.map((client) =>
      prisma.client.create({
        data: {
          name: client.name,
          contactName: client.contactName,
          email: client.email,
          phone: client.phone,
          notes: client.notes,
          billingProfile: client.billingProfile
            ? {
                create: client.billingProfile
              }
            : undefined
        },
        include: {
          billingProfile: true
        }
      })
    )
  );

  await Promise.all(
    clients.slice(0, 4).map((client, index) =>
      prisma.user.create({
        data: {
          name: client.contactName,
          email: `portal${index + 1}@cliente.com`,
          passwordHash: defaultPasswordHash,
          role: "CLIENT",
          clientId: client.id
        }
      })
    )
  );

  await prisma.paymentInstruction.createMany({
    data: [
      {
        title: "Pix principal",
        paymentChannel: "Pix",
        pixKey: "financeiro@pontodatecnologia.com.br",
        pixCopyPaste: "00020126360014BR.GOV.BCB.PIX0114financeiro@ponto5204000053039865406100.005802BR5920PONTO DA TECNOLOGIA6009SAO PAULO62070503***6304ABCD",
        notes: "Após o pagamento, envie o comprovante se a cobrança ainda não tiver baixa automática.",
        active: true,
        sortOrder: 1
      },
      {
        title: "Transferência bancária",
        paymentChannel: "Transferência",
        bankName: "Banco do Brasil",
        bankAgency: "1234-5",
        bankAccount: "98765-4",
        accountHolder: "Ponto da Tecnologia Ltda",
        accountDocument: "12.345.678/0001-90",
        notes: "Use a referência da cobrança ao efetuar a transferência.",
        active: true,
        sortOrder: 2
      }
    ]
  });

  const partCatalogItems = await Promise.all(
    [
      { name: "SSD 480GB", code: "SSD-480", unitPrice: 349.9, stockQuantity: 10 },
      { name: "Memória DDR4 8GB", code: "MEM-8GB", unitPrice: 179.9, stockQuantity: 16 },
      { name: "Fonte 500W", code: "FON-500", unitPrice: 289.9, stockQuantity: 8 },
      { name: "Roteador Wi-Fi AX", code: "ROT-AX", unitPrice: 459.9, stockQuantity: 5 }
    ].map((part) =>
      prisma.partCatalogItem.create({
        data: {
          ...part,
          description: `Item de estoque seed: ${part.name}.`
        }
      })
    )
  );

  const ticketSeeds = [];
  const totalTickets = 72;
  const createdTickets = [];

  for (let index = 0; index < totalTickets; index += 1) {
    const template = issueTemplates[index % issueTemplates.length];
    const client = clients[index % clients.length];
    const status = statusCycle[index % statusCycle.length];
    const priority = priorityCycle[index % priorityCycle.length];
    const openedBy = attendants[index % attendants.length] ?? admins[index % admins.length];
    const fallbackAdmin = admins[index % admins.length];
    const assignedTechnician = technicians[index % technicians.length];
    const assignedAttendant = attendants[(index + 1) % attendants.length];
    const assignee =
      status === "OPEN"
        ? null
        : template.category === "Acesso" || template.category === "E-mail"
          ? assignedAttendant
          : assignedTechnician;
    const createdAt = daysAgo(42 - Math.floor(index / 2), 8 + (index % 8), (index * 7) % 60);
    const updatedAt = hoursAfter(createdAt, 2 + (index % 14));
    const requesterName = client.contactName;
    const requesterEmail = client.email;
    const includeAttachments = index % 6 === 0 || priority === "CRITICAL";
    const comments = [
      {
        authorId: assignee?.id ?? openedBy.id,
        message: "Primeira analise registrada na fila de atendimento.",
        createdAt: minutesAfter(createdAt, 55)
      }
    ];

    if (status === "WAITING_CUSTOMER") {
      comments.push({
        authorId: fallbackAdmin.id,
        message: "Cliente orientado sobre o proximo passo e validacao pendente.",
        createdAt: minutesAfter(updatedAt, 10)
      });
    }

    const shouldCreateBilling = status !== "OPEN" && (index % 2 === 0 || status === "CLOSED");
    const billingType = client.billingProfile?.defaultBillingType ?? billingTypeCycle[index % billingTypeCycle.length];
    const financialStatus = buildFinancialStatus(status, index, billingType);
    const billingCreatedAt = minutesAfter(updatedAt, 25);
    const billingUpdatedAt = minutesAfter(updatedAt, 80);
    const billingEntries = shouldCreateBilling
      ? buildBillingEntries({
          profile: client.billingProfile,
          financialStatus: billingStatusToBillableReference(financialStatus, billingType),
          createdAt: billingCreatedAt,
          createdById: openedBy.id,
          includeTravel: index % 3 === 0,
          index
        })
      : [];
    const subtotalAmount = decimal(billingEntries.reduce((sum, entry) => sum + entry.totalPrice, 0));
    const discountPercent = Number(client.billingProfile?.defaultDiscountPercent ?? 0);
    const discountAmount =
      shouldCreateBilling && billingType !== "CORTESIA" && billingType !== "GARANTIA"
        ? decimal(subtotalAmount * (discountPercent / 100))
        : shouldCreateBilling && billingType === "CORTESIA"
          ? subtotalAmount
          : 0;
    const totalAmount = shouldCreateBilling ? decimal(Math.max(subtotalAmount - discountAmount, 0)) : 0;

    ticketSeeds.push({
      number: `CH-2026-${pad(index + 1)}`,
      title: `${template.title} - ${client.name}`,
      description: template.description,
      category: template.category,
      priority,
      status,
      requesterName,
      requesterEmail,
      clientId: client.id,
      assigneeId: assignee?.id ?? null,
      openedById: openedBy.id,
      createdAt,
      updatedAt,
      resolvedAt: status === "RESOLVED" || status === "CLOSED" ? updatedAt : null,
      closedAt: status === "CLOSED" ? minutesAfter(updatedAt, 30) : null,
      closingReason:
        status === "CLOSED" ? "Atendimento concluido com validacao do cliente e checklist final." : null,
      comments,
      attachments: includeAttachments ? [pickAttachment(index)] : [],
      billing:
        shouldCreateBilling
          ? {
              billingType,
              financialStatus,
              subtotalAmount,
              discountAmount,
              totalAmount,
              internalNotes: client.billingProfile?.contractNotes ?? "Resumo financeiro gerado pelo seed.",
              approvedAt:
                financialStatus === "APROVADO" || financialStatus === "FATURADO" || financialStatus === "PAGO"
                  ? minutesAfter(billingUpdatedAt, 15)
                  : null,
              invoicedAt: financialStatus === "FATURADO" || financialStatus === "PAGO" ? minutesAfter(billingUpdatedAt, 40) : null,
              paidAt: financialStatus === "PAGO" ? minutesAfter(billingUpdatedAt, 70) : null,
              entries: billingEntries,
              history: buildBillingHistory({
                authorId: openedBy.id,
                billingType,
                financialStatus,
                createdAt: billingCreatedAt,
                updatedAt: billingUpdatedAt,
                entryCount: billingEntries.length,
                totalAmount
              })
            }
          : null
    });
  }

  for (const seed of ticketSeeds) {
    const createdTicket = await prisma.ticket.create({
      data: {
        number: seed.number,
        title: seed.title,
        description: seed.description,
        category: seed.category,
        priority: seed.priority,
        status: seed.status,
        requesterName: seed.requesterName,
        requesterEmail: seed.requesterEmail,
        clientId: seed.clientId,
        assigneeId: seed.assigneeId,
        openedById: seed.openedById,
        createdAt: seed.createdAt,
        updatedAt: seed.updatedAt,
        resolvedAt: seed.resolvedAt,
        closedAt: seed.closedAt,
        closingReason: seed.closingReason,
        history: {
          create: buildTicketHistory({
            openedById: seed.openedById,
            assigneeId: seed.assigneeId,
            status: seed.status,
            priority: seed.priority,
            createdAt: seed.createdAt,
            updatedAt: seed.updatedAt,
            title: seed.title,
            comments: seed.comments
          })
        },
        attachments: {
          create: seed.attachments
        },
        billing: seed.billing
          ? {
              create: {
                billingType: seed.billing.billingType,
                financialStatus: seed.billing.financialStatus,
                subtotalAmount: seed.billing.subtotalAmount,
                discountAmount: seed.billing.discountAmount,
                totalAmount: seed.billing.totalAmount,
                internalNotes: seed.billing.internalNotes,
                approvedAt: seed.billing.approvedAt,
                invoicedAt: seed.billing.invoicedAt,
                paidAt: seed.billing.paidAt,
                createdAt: seed.createdAt,
                updatedAt: seed.updatedAt,
                entries: {
                  create: seed.billing.entries
                },
                history: {
                  create: seed.billing.history
                }
              }
            }
          : undefined
      }
    });

    createdTickets.push(createdTicket);
  }

  const sales = [];

  for (let index = 0; index < 8; index += 1) {
    const client = clients[index % clients.length];
    const createdBy = attendants[index % attendants.length] ?? admins[0];
    const part = partCatalogItems[index % partCatalogItems.length];
    const quantity = 1 + (index % 2);
    const financialStatus = index % 3 === 0 ? "PAGO" : index % 4 === 0 ? "CANCELADO" : "PENDENTE";
    const createdAt = daysAgo(18 - index, 10 + (index % 6), 15);
    const totalPrice = decimal(Number(part.unitPrice) * quantity);

    const sale = await prisma.sale.create({
      data: {
        number: `VD-2026-${pad(index + 1)}`,
        clientId: client.id,
        financialStatus,
        paymentMethod: financialStatus === "PAGO" ? "Pix" : null,
        paymentDate: financialStatus === "PAGO" ? minutesAfter(createdAt, 240) : null,
        paymentReference: financialStatus === "PAGO" ? `PIX-${pad(index + 1)}` : null,
        totalAmount: totalPrice,
        paidAt: financialStatus === "PAGO" ? minutesAfter(createdAt, 240) : null,
        canceledAt: financialStatus === "CANCELADO" ? minutesAfter(createdAt, 120) : null,
        cancellationReason: financialStatus === "CANCELADO" ? "Venda cancelada pelo cliente durante a aprovação." : null,
        internalNotes: "Venda seed para o portal do cliente.",
        createdById: createdBy.id,
        createdAt,
        updatedAt: minutesAfter(createdAt, 30),
        items: {
          create: {
            partCatalogItemId: part.id,
            partName: part.name,
            partCode: part.code,
            quantity,
            unitPrice: part.unitPrice,
            totalPrice
          }
        }
      },
      include: {
        items: true
      }
    });

    if (financialStatus !== "CANCELADO") {
      await prisma.stockMovement.create({
        data: {
          partCatalogItemId: part.id,
          type: "SALE_EXIT",
          quantity,
          saleId: sale.id,
          createdById: createdBy.id
        }
      });

      await prisma.partCatalogItem.update({
        where: { id: part.id },
        data: {
          stockQuantity: {
            decrement: quantity
          }
        }
      });
    }

    sales.push(sale);
  }

  await Promise.all(
    createdTickets.slice(0, 6).map((ticket, index) =>
      prisma.fiscalDocument.create({
        data: {
          clientId: ticket.clientId,
          type: index % 2 === 0 ? "NFSE" : "RECIBO",
          number: `DOC-2026-${pad(index + 1)}`,
          series: "1",
          issueDate: daysAgo(12 - index, 14, 0),
          totalAmount: decimal(180 + index * 37.5),
          fileName: `documento-${index + 1}.pdf`,
          filePath: `/uploads/fiscal/documento-${index + 1}.pdf`,
          notes: "Documento fiscal seed disponibilizado no portal.",
          links: {
            create: [
              {
                ticketId: ticket.id,
                label: `Chamado ${ticket.number}`
              },
              ...(sales[index]
                ? [
                    {
                      saleId: sales[index].id,
                      label: `Venda ${sales[index].number}`
                    }
                  ]
                : [])
            ]
          }
        }
      })
    )
  );

  const billedCount = ticketSeeds.filter((ticket) => ticket.billing).length;
  console.log(
    `Seed concluido com ${users.length + 4} usuarios, ${clients.length} clientes, ${ticketSeeds.length} chamados, ${billedCount} chamados com financeiro e ${sales.length} vendas.`
  );
}

function billingStatusToBillableReference(financialStatus, billingType) {
  if (billingType === "CORTESIA") {
    return "CORTESIA";
  }

  if (financialStatus === "CANCELADO") {
    return "CANCELADO";
  }

  return financialStatus;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
