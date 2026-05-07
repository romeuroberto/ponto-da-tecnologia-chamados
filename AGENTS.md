# AGENTS

## Projeto

Sistema web de chamados para operacao interna de uma empresa de TI.

Objetivo:
- registrar chamados
- acompanhar status
- atribuir responsavel
- registrar historico
- controlar clientes e usuarios internos

## Stack oficial

- Next.js App Router
- TypeScript
- Prisma
- PostgreSQL
- Tailwind CSS
- Auth.js com credenciais

## Comandos principais

```powershell
npm.cmd run dev
npm.cmd run build
npm.cmd run prisma:generate
npm.cmd run prisma:migrate
npm.cmd run prisma:seed
```

## Ambiente

Criar `.env.local` com:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ticket_system"
AUTH_SECRET="defina-um-segredo-forte"
```

## Usuarios seed

Depois de rodar o seed:

- `mariana@empresa.com`
- `carlos@empresa.com`
- `paulo@empresa.com`

Senha padrao:

- `123456`

## Perfis e permissoes

### ADMIN

- acesso total
- gerencia usuarios
- cria e edita clientes
- cria chamados
- altera status, prioridade e responsavel
- comenta em chamados

### ATTENDANT

- acessa dashboard, chamados e clientes
- cria e edita clientes
- cria chamados
- altera status, prioridade e responsavel
- comenta em chamados

### TECHNICIAN

- acessa dashboard, chamados e clientes
- nao cria clientes
- nao cria chamados
- nao acessa usuarios
- altera status de chamados
- comenta em chamados
- nao altera prioridade nem responsavel

## Fluxo principal do chamado

1. abrir chamado
2. vincular cliente
3. definir prioridade
4. atribuir responsavel
5. atualizar status
6. adicionar comentarios no historico
7. encerrar ou resolver

Status suportados:

- `OPEN`
- `IN_PROGRESS`
- `WAITING_CUSTOMER`
- `RESOLVED`
- `CLOSED`
- `CANCELED`

Prioridades:

- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

## Estrutura importante

- `src/app`
  paginas e rotas App Router
- `src/app/api`
  APIs internas
- `src/server/repositories`
  acesso a dados
- `src/server/services`
  regras de negocio
- `src/server/auth`
  sessao, guards e permissoes
- `src/components`
  componentes de UI e formularios
- `prisma/schema.prisma`
  schema do banco

## O que ja esta pronto

- autenticacao com login por credenciais
- sessao com perfil
- protecao de rotas e APIs
- CRUD basico de clientes e usuarios
- criacao de chamados
- detalhe de chamado com atualizacao
- comentarios e historico
- filtros e paginacao em chamados, clientes e usuarios
- UI com autorizacao visual por perfil

## O que ainda falta

- ordenacao nas listagens
- filtro por periodo em chamados
- upload real de anexos
- dashboard mais completo
- recuperacao de senha
- auditoria mais detalhada
- refinamentos de UX e feedback
- modulo financeiro simples por chamado

## Direcao do financeiro

- manter financeiro separado do historico tecnico
- usar `TicketBilling` para resumo financeiro do chamado
- usar `BillingEntry` para horas, pecas, deslocamento e extras
- permitir tipos `AVULSO`, `CONTRATO`, `GARANTIA` e `CORTESIA`
- permitir status `PENDENTE`, `EM_ANALISE`, `APROVADO`, `FATURADO`, `PAGO` e `CANCELADO`
- priorizar lancamento manual no MVP

## Convencoes

- codigo em ingles
- interface em portugues
- na interface e na documentacao em portugues, usar acentuacao correta
- regras de negocio em `services`
- acesso ao banco em `repositories`
- validar dados antes de gravar
- preservar controle de acesso no frontend e no backend

## Regras para agentes

- nao reintroduzir `mock-data` em paginas ja conectadas
- manter build limpo com `npm.cmd run build`
- preferir alteracoes pequenas e incrementais
- respeitar a matriz de permissoes existente
- ao mexer em auth, validar paginas e APIs protegidas
- nao remover acentos de textos em portugues
