const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function hoursAgo(totalHours) {
  return new Date(Date.now() - totalHours * 60 * 60 * 1000);
}

function minutesAfter(baseDate, minutes) {
  return new Date(baseDate.getTime() + minutes * 60 * 1000);
}

function buildHistory({
  openedById,
  assigneeId,
  status,
  priority,
  createdMessage,
  updatedMessage,
  createdAt,
  updatedAt,
  comments = []
}) {
  const history = [
    {
      authorId: openedById,
      eventType: "CREATED",
      message: createdMessage,
      createdAt
    }
  ];

  if (assigneeId) {
    history.push({
      authorId: openedById,
      eventType: "ASSIGNEE_CHANGE",
      message: "Responsavel definido para atendimento inicial.",
      createdAt: new Date(createdAt.getTime() + 20 * 60 * 1000)
    });
  }

  if (status !== "OPEN") {
    history.push({
      authorId: assigneeId ?? openedById,
      eventType: "STATUS_CHANGE",
      message: updatedMessage,
      previousStatus: "OPEN",
      nextStatus: status,
      createdAt: updatedAt
    });
  }

  if (priority === "CRITICAL") {
    history.push({
      authorId: openedById,
      eventType: "PRIORITY_CHANGE",
      message: "Prioridade ajustada para critica devido ao impacto no cliente.",
      previousPriority: "HIGH",
      nextPriority: "CRITICAL",
      createdAt: new Date(createdAt.getTime() + 10 * 60 * 1000)
    });
  }

  if (status === "RESOLVED" || status === "CLOSED") {
    history.push({
      authorId: assigneeId ?? openedById,
      eventType: status === "CLOSED" ? "CLOSED" : "COMMENT",
      message: status === "CLOSED" ? "Chamado encerrado apos validacao do cliente." : "Correcao aplicada e aguardando encerramento.",
      createdAt: new Date(updatedAt.getTime() + 15 * 60 * 1000)
    });
  }

  comments.forEach((comment, index) => {
    history.push({
      authorId: comment.authorId,
      eventType: "COMMENT",
      message: comment.message,
      createdAt: comment.createdAt ?? minutesAfter(createdAt, 45 + index * 40)
    });
  });

  history.sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  return history;
}

async function main() {
  await prisma.ticketHistory.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  const defaultPasswordHash = await bcrypt.hash("123456", 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Mariana Costa",
        email: "mariana@empresa.com",
        passwordHash: defaultPasswordHash,
        role: "ADMIN"
      }
    }),
    prisma.user.create({
      data: {
        name: "Carlos Souza",
        email: "carlos@empresa.com",
        passwordHash: defaultPasswordHash,
        role: "ATTENDANT"
      }
    }),
    prisma.user.create({
      data: {
        name: "Paulo Lima",
        email: "paulo@empresa.com",
        passwordHash: defaultPasswordHash,
        role: "TECHNICIAN"
      }
    }),
    prisma.user.create({
      data: {
        name: "Juliana Mendes",
        email: "juliana@empresa.com",
        passwordHash: defaultPasswordHash,
        role: "ATTENDANT"
      }
    }),
    prisma.user.create({
      data: {
        name: "Ricardo Nunes",
        email: "ricardo@empresa.com",
        passwordHash: defaultPasswordHash,
        role: "TECHNICIAN"
      }
    })
  ]);

  const [admin, attendantA, technicianA, attendantB, technicianB] = users;

  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: "Alfa Contabilidade",
        contactName: "Fernanda Rocha",
        email: "fernanda@alfa.com.br",
        phone: "(11) 98888-1111",
        notes: "Cliente com alta recorrencia de suporte remoto."
      }
    }),
    prisma.client.create({
      data: {
        name: "Mercado Central",
        contactName: "Rafael Teles",
        email: "rafael@mercadocentral.com",
        phone: "(11) 97777-2222",
        notes: "Priorizar falhas relacionadas ao caixa."
      }
    }),
    prisma.client.create({
      data: {
        name: "Clinica Vida",
        contactName: "Luciana Prado",
        email: "luciana@clinicavida.com.br",
        phone: "(11) 96666-3333"
      }
    }),
    prisma.client.create({
      data: {
        name: "TransLog Express",
        contactName: "Bruno Salles",
        email: "bruno@translog.com.br",
        phone: "(11) 95555-4444",
        notes: "Opera 24x7 e depende fortemente do sistema de rastreio."
      }
    }),
    prisma.client.create({
      data: {
        name: "Escola Horizonte",
        contactName: "Patricia Nogueira",
        email: "patricia@escolahorizonte.com.br",
        phone: "(11) 94444-5555"
      }
    }),
    prisma.client.create({
      data: {
        name: "Oficina Master Car",
        contactName: "Diego Araujo",
        email: "diego@mastercar.com.br",
        phone: "(11) 93333-6666"
      }
    })
  ]);

  const [clientA, clientB, clientC, clientD, clientE, clientF] = clients;

  const ticketSeeds = [
    {
      number: "CH-2026-001",
      title: "Erro ao emitir nota fiscal",
      description: "O sistema retorna erro ao concluir a emissao da nota fiscal em duas estacoes.",
      category: "Sistema",
      priority: "CRITICAL",
      status: "IN_PROGRESS",
      requesterName: "Fernanda Rocha",
      requesterEmail: "fernanda@alfa.com.br",
      clientId: clientA.id,
      assigneeId: technicianA.id,
      openedById: attendantA.id,
      createdAt: hoursAgo(72),
      updatedAt: hoursAgo(69),
      createdMessage: "Chamado aberto e priorizado como critico.",
      updatedMessage: "Analise iniciada. Possivel falha na integracao fiscal.",
      comments: [
        {
          authorId: technicianA.id,
          message: "Logs coletados e enviados para revisao da integracao fiscal.",
          createdAt: hoursAgo(70)
        }
      ],
      attachments: [
        {
          fileName: "erro-nf-log.txt",
          filePath: "/uploads/tickets/seed-attachments/erro-nf-log.txt",
          mimeType: "text/plain",
          sizeBytes: 2048
        }
      ]
    },
    {
      number: "CH-2026-002",
      title: "Usuario sem acesso ao e-mail",
      description: "Solicitante nao consegue autenticar no Outlook desde o inicio da manha.",
      category: "E-mail",
      priority: "HIGH",
      status: "WAITING_CUSTOMER",
      requesterName: "Rafael Teles",
      requesterEmail: "rafael@mercadocentral.com",
      clientId: clientB.id,
      assigneeId: attendantA.id,
      openedById: admin.id,
      createdAt: hoursAgo(68),
      updatedAt: hoursAgo(66),
      createdMessage: "Chamado aberto via atendimento telefonico.",
      updatedMessage: "Solicitada validacao de senha e teste em outro dispositivo.",
      comments: [
        {
          authorId: attendantA.id,
          message: "Usuario informou que o problema ocorre em desktop e celular.",
          createdAt: hoursAgo(67)
        }
      ]
    },
    {
      number: "CH-2026-003",
      title: "Instalacao de impressora no financeiro",
      description: "Necessario configurar uma nova impressora no setor financeiro.",
      category: "Infraestrutura",
      priority: "MEDIUM",
      status: "OPEN",
      requesterName: "Luciana Prado",
      requesterEmail: "luciana@clinicavida.com.br",
      clientId: clientC.id,
      assigneeId: null,
      openedById: attendantA.id,
      createdAt: hoursAgo(65),
      updatedAt: hoursAgo(65),
      createdMessage: "Chamado aguardando atribuicao.",
      updatedMessage: "Chamado aguardando atribuicao."
    },
    {
      number: "CH-2026-004",
      title: "Servidor de arquivos indisponivel",
      description: "Usuarios nao conseguem acessar a pasta compartilhada principal.",
      category: "Infraestrutura",
      priority: "CRITICAL",
      status: "IN_PROGRESS",
      requesterName: "Bruno Salles",
      requesterEmail: "bruno@translog.com.br",
      clientId: clientD.id,
      assigneeId: technicianB.id,
      openedById: attendantB.id,
      createdAt: hoursAgo(60),
      updatedAt: hoursAgo(58),
      createdMessage: "Incidente registrado com impacto alto na operacao.",
      updatedMessage: "Tecnico em analise de rede e permissao de compartilhamento.",
      comments: [
        {
          authorId: technicianB.id,
          message: "Acesso restabelecido parcialmente, mantendo monitoramento.",
          createdAt: hoursAgo(57)
        }
      ],
      attachments: [
        {
          fileName: "mapa-servidor-arquivos.txt",
          filePath: "/uploads/tickets/seed-attachments/mapa-servidor-arquivos.txt",
          mimeType: "text/plain",
          sizeBytes: 1536
        }
      ]
    },
    {
      number: "CH-2026-005",
      title: "Cadastro de aluno nao salva",
      description: "Formulario trava ao concluir novo cadastro na secretaria.",
      category: "Sistema",
      priority: "HIGH",
      status: "OPEN",
      requesterName: "Patricia Nogueira",
      requesterEmail: "patricia@escolahorizonte.com.br",
      clientId: clientE.id,
      assigneeId: null,
      openedById: attendantB.id,
      createdAt: hoursAgo(54),
      updatedAt: hoursAgo(54),
      createdMessage: "Solicitacao registrada e aguardando triagem.",
      updatedMessage: "Solicitacao registrada e aguardando triagem."
    },
    {
      number: "CH-2026-006",
      title: "Computador da recepcao lento",
      description: "Equipamento apresenta lentidao severa na abertura de programas.",
      category: "Hardware",
      priority: "LOW",
      status: "RESOLVED",
      requesterName: "Luciana Prado",
      requesterEmail: "luciana@clinicavida.com.br",
      clientId: clientC.id,
      assigneeId: technicianA.id,
      openedById: attendantA.id,
      createdAt: hoursAgo(52),
      updatedAt: hoursAgo(48),
      createdMessage: "Chamado aberto para diagnostico de performance.",
      updatedMessage: "Limpeza de sistema executada com melhora confirmada.",
      comments: [
        {
          authorId: technicianA.id,
          message: "Itens de inicializacao desnecessarios foram removidos.",
          createdAt: hoursAgo(49)
        }
      ]
    },
    {
      number: "CH-2026-007",
      title: "Erro no caixa ao fechar venda",
      description: "Terminal retorna mensagem de integracao pendente ao finalizar pagamento.",
      category: "PDV",
      priority: "HIGH",
      status: "IN_PROGRESS",
      requesterName: "Rafael Teles",
      requesterEmail: "rafael@mercadocentral.com",
      clientId: clientB.id,
      assigneeId: technicianB.id,
      openedById: admin.id,
      createdAt: hoursAgo(46),
      updatedAt: hoursAgo(42),
      createdMessage: "Chamado aberto com impacto direto em vendas.",
      updatedMessage: "Log coletado e correcoes em andamento no terminal.",
      comments: [
        {
          authorId: technicianB.id,
          message: "Erro reproduzido apenas em um terminal especifico do caixa 2.",
          createdAt: hoursAgo(43)
        }
      ]
    },
    {
      number: "CH-2026-008",
      title: "VPN nao conecta para home office",
      description: "Gerente nao consegue estabelecer conexao remota com a empresa.",
      category: "Rede",
      priority: "MEDIUM",
      status: "WAITING_CUSTOMER",
      requesterName: "Fernanda Rocha",
      requesterEmail: "fernanda@alfa.com.br",
      clientId: clientA.id,
      assigneeId: technicianA.id,
      openedById: attendantB.id,
      createdAt: hoursAgo(40),
      updatedAt: hoursAgo(38),
      createdMessage: "Chamado aberto para validar credenciais e VPN.",
      updatedMessage: "Aguardando teste de acesso apos reset de credenciais.",
      attachments: [
        {
          fileName: "passos-vpn.pdf",
          filePath: "/uploads/tickets/seed-attachments/passos-vpn.pdf",
          mimeType: "application/pdf",
          sizeBytes: 4096
        }
      ]
    },
    {
      number: "CH-2026-009",
      title: "Solicitacao de novo usuario no sistema",
      description: "Criar acesso para colaborador recem-contratado no modulo administrativo.",
      category: "Acesso",
      priority: "LOW",
      status: "CLOSED",
      requesterName: "Patricia Nogueira",
      requesterEmail: "patricia@escolahorizonte.com.br",
      clientId: clientE.id,
      assigneeId: attendantA.id,
      openedById: admin.id,
      createdAt: hoursAgo(36),
      updatedAt: hoursAgo(30),
      createdMessage: "Solicitacao de cadastro recebida pelo atendimento.",
      updatedMessage: "Usuario criado e acesso validado com o solicitante."
    },
    {
      number: "CH-2026-010",
      title: "Backup noturno com falha",
      description: "Job de backup falhou nas ultimas duas madrugadas.",
      category: "Backup",
      priority: "CRITICAL",
      status: "IN_PROGRESS",
      requesterName: "Bruno Salles",
      requesterEmail: "bruno@translog.com.br",
      clientId: clientD.id,
      assigneeId: technicianA.id,
      openedById: admin.id,
      createdAt: hoursAgo(28),
      updatedAt: hoursAgo(24),
      createdMessage: "Rotina de backup reportada com falha recorrente.",
      updatedMessage: "Validacao de espaco em disco e integridade do destino iniciada.",
      comments: [
        {
          authorId: technicianA.id,
          message: "Detectado crescimento acelerado da particao de destino.",
          createdAt: hoursAgo(26)
        }
      ]
    },
    {
      number: "CH-2026-011",
      title: "Telefone IP sem audio",
      description: "Aparelho liga normalmente, mas nao transmite audio nas ligacoes.",
      category: "Telefonia",
      priority: "MEDIUM",
      status: "OPEN",
      requesterName: "Diego Araujo",
      requesterEmail: "diego@mastercar.com.br",
      clientId: clientF.id,
      assigneeId: null,
      openedById: attendantB.id,
      createdAt: hoursAgo(22),
      updatedAt: hoursAgo(22),
      createdMessage: "Solicitacao aberta e aguardando tecnico disponivel.",
      updatedMessage: "Solicitacao aberta e aguardando tecnico disponivel."
    },
    {
      number: "CH-2026-012",
      title: "Erro 500 na intranet",
      description: "Pagina interna de recados retorna erro 500 ao carregar.",
      category: "Sistema",
      priority: "HIGH",
      status: "RESOLVED",
      requesterName: "Fernanda Rocha",
      requesterEmail: "fernanda@alfa.com.br",
      clientId: clientA.id,
      assigneeId: technicianB.id,
      openedById: attendantA.id,
      createdAt: hoursAgo(20),
      updatedAt: hoursAgo(16),
      createdMessage: "Erro validado em mais de um navegador.",
      updatedMessage: "Servico reiniciado e erro corrigido.",
      comments: [
        {
          authorId: technicianB.id,
          message: "Cache da aplicacao limpo antes da reinicializacao do servico.",
          createdAt: hoursAgo(17)
        }
      ]
    },
    {
      number: "CH-2026-013",
      title: "Permissao negada na pasta RH",
      description: "Gestora perdeu acesso a documentos do setor apos mudanca de senha.",
      category: "Acesso",
      priority: "MEDIUM",
      status: "WAITING_CUSTOMER",
      requesterName: "Luciana Prado",
      requesterEmail: "luciana@clinicavida.com.br",
      clientId: clientC.id,
      assigneeId: attendantA.id,
      openedById: admin.id,
      createdAt: hoursAgo(18),
      updatedAt: hoursAgo(14),
      createdMessage: "Ticket aberto para revisao de permissoes.",
      updatedMessage: "Permissao ajustada. Aguardando confirmacao do cliente."
    },
    {
      number: "CH-2026-014",
      title: "Wi-Fi oscilando no escritorio",
      description: "Conexao sem fio cai em intervalos curtos na area administrativa.",
      category: "Rede",
      priority: "HIGH",
      status: "IN_PROGRESS",
      requesterName: "Patricia Nogueira",
      requesterEmail: "patricia@escolahorizonte.com.br",
      clientId: clientE.id,
      assigneeId: technicianB.id,
      openedById: attendantB.id,
      createdAt: hoursAgo(15),
      updatedAt: hoursAgo(11),
      createdMessage: "Incidente de conectividade registrado com urgencia.",
      updatedMessage: "Analise do access point e mudanca de canal em execucao.",
      comments: [
        {
          authorId: technicianB.id,
          message: "Foi identificado ruido no canal atual do access point principal.",
          createdAt: hoursAgo(12)
        }
      ]
    },
    {
      number: "CH-2026-015",
      title: "Solicitacao de instalacao do Office",
      description: "Novo computador precisa receber pacote Office e impressoras.",
      category: "Software",
      priority: "LOW",
      status: "CLOSED",
      requesterName: "Diego Araujo",
      requesterEmail: "diego@mastercar.com.br",
      clientId: clientF.id,
      assigneeId: technicianA.id,
      openedById: attendantA.id,
      createdAt: hoursAgo(12),
      updatedAt: hoursAgo(9),
      createdMessage: "Solicitacao agendada para configuracao local.",
      updatedMessage: "Instalacao concluida e validada pelo usuario."
    },
    {
      number: "CH-2026-016",
      title: "Monitor nao liga",
      description: "Estacao do caixa secundario permanece sem video apos reinicio.",
      category: "Hardware",
      priority: "MEDIUM",
      status: "OPEN",
      requesterName: "Rafael Teles",
      requesterEmail: "rafael@mercadocentral.com",
      clientId: clientB.id,
      assigneeId: null,
      openedById: attendantB.id,
      createdAt: hoursAgo(10),
      updatedAt: hoursAgo(10),
      createdMessage: "Chamado registrado para verificacao de energia e cabos.",
      updatedMessage: "Chamado registrado para verificacao de energia e cabos."
    },
    {
      number: "CH-2026-017",
      title: "Lentidao no banco de dados",
      description: "Consultas do sistema principal estao mais lentas desde a atualizacao.",
      category: "Banco de dados",
      priority: "CRITICAL",
      status: "IN_PROGRESS",
      requesterName: "Bruno Salles",
      requesterEmail: "bruno@translog.com.br",
      clientId: clientD.id,
      assigneeId: technicianA.id,
      openedById: admin.id,
      createdAt: hoursAgo(8),
      updatedAt: hoursAgo(5),
      createdMessage: "Ocorrencia aberta com impacto em varias equipes.",
      updatedMessage: "Indices e consultas em revisao para reduzir tempo de resposta.",
      comments: [
        {
          authorId: technicianA.id,
          message: "Plano de execucao aponta gargalo em consulta de pedidos recentes.",
          createdAt: hoursAgo(6)
        }
      ],
      attachments: [
        {
          fileName: "analise-consulta-bd.txt",
          filePath: "/uploads/tickets/seed-attachments/analise-consulta-bd.txt",
          mimeType: "text/plain",
          sizeBytes: 3072
        }
      ]
    },
    {
      number: "CH-2026-018",
      title: "Relatorio PDF sai em branco",
      description: "Modulo financeiro gera arquivo PDF vazio ao exportar.",
      category: "Sistema",
      priority: "HIGH",
      status: "RESOLVED",
      requesterName: "Fernanda Rocha",
      requesterEmail: "fernanda@alfa.com.br",
      clientId: clientA.id,
      assigneeId: technicianB.id,
      openedById: attendantA.id,
      createdAt: hoursAgo(7),
      updatedAt: hoursAgo(3),
      createdMessage: "Defeito reproduzido com mesma base do cliente.",
      updatedMessage: "Biblioteca de geracao reiniciada e exportacao normalizada.",
      comments: [
        {
          authorId: technicianB.id,
          message: "Cliente recebeu arquivo de teste e confirmou a renderizacao correta.",
          createdAt: hoursAgo(2)
        }
      ]
    },
    {
      number: "CH-2026-019",
      title: "Cadastro de fornecedor duplicando",
      description: "Ao salvar, o sistema cria dois registros identicos.",
      category: "Sistema",
      priority: "MEDIUM",
      status: "WAITING_CUSTOMER",
      requesterName: "Luciana Prado",
      requesterEmail: "luciana@clinicavida.com.br",
      clientId: clientC.id,
      assigneeId: attendantB.id,
      openedById: admin.id,
      createdAt: hoursAgo(6),
      updatedAt: hoursAgo(2),
      createdMessage: "Chamado aberto para analise de fluxo de cadastro.",
      updatedMessage: "Correcao aplicada em homologacao. Aguardando retorno do cliente."
    },
    {
      number: "CH-2026-020",
      title: "Bloqueio de acesso ap\u00f3s v\u00e1rias tentativas",
      description: "Usu\u00e1rio foi bloqueado ap\u00f3s tentativas consecutivas de login no portal.",
      category: "Acesso",
      priority: "LOW",
      status: "CLOSED",
      requesterName: "Patricia Nogueira",
      requesterEmail: "patricia@escolahorizonte.com.br",
      clientId: clientE.id,
      assigneeId: attendantA.id,
      openedById: attendantB.id,
      createdAt: hoursAgo(5),
      updatedAt: hoursAgo(1),
      createdMessage: "Solicitacao aberta para desbloqueio de usuario.",
      updatedMessage: "Conta desbloqueada e acesso confirmado com o solicitante.",
      comments: [
        {
          authorId: attendantA.id,
          message: "Orientado o uso de redefinicao de senha para evitar novo bloqueio.",
          createdAt: hoursAgo(1)
        }
      ]
    }
  ];

  for (const seed of ticketSeeds) {
    const {
      createdMessage,
      updatedMessage,
      createdAt,
      updatedAt,
      status,
      priority,
      assigneeId,
      openedById,
      comments = [],
      attachments = [],
      ...ticketData
    } = seed;

    await prisma.ticket.create({
      data: {
        ...ticketData,
        status,
        priority,
        assigneeId,
        openedById,
        createdAt,
        updatedAt,
        resolvedAt: status === "RESOLVED" || status === "CLOSED" ? updatedAt : null,
        closedAt: status === "CLOSED" ? updatedAt : null,
        closingReason: status === "CLOSED" ? "Atendimento concluido com validacao do cliente." : null,
        history: {
          create: buildHistory({
            openedById,
            assigneeId,
            status,
            priority,
            createdMessage,
            updatedMessage,
            createdAt,
            updatedAt,
            comments
          })
        },
        attachments: {
          create: attachments
        }
      }
    });
  }

  console.log(`Seed concluido com ${users.length} usuarios, ${clients.length} clientes e ${ticketSeeds.length} chamados.`);
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
