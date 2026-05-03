# Estrutura Inicial do Projeto

Objetivo: definir uma estrutura curta e suficiente para a IA gerar codigo consistente.

## Estrutura sugerida

```text
src/
  app/
    (auth)/
      login/
    (dashboard)/
      dashboard/
      chamados/
      chamados/novo/
      chamados/[id]/
      clientes/
      clientes/novo/
      clientes/[id]/
      usuarios/
      usuarios/novo/
      usuarios/[id]/
    api/
      auth/
      clients/
      tickets/
      users/
      dashboard/
  components/
    layout/
    dashboard/
    tickets/
    clients/
    users/
    forms/
    ui/
  lib/
    auth/
    db/
    permissions/
    validations/
    utils/
  server/
    services/
    repositories/
  types/
prisma/
  schema.prisma
```

## Modulos principais

### `tickets`

- listagem
- detalhe
- criacao
- alteracao de status
- alteracao de prioridade
- alteracao de responsavel
- comentarios

### `clients`

- listagem
- criacao
- edicao
- detalhe com chamados

### `users`

- listagem
- criacao
- edicao
- perfis

### `dashboard`

- resumo de indicadores
- chamados recentes
- chamados prioritarios

## Componentes base

- `AppShell`
- `Sidebar`
- `Topbar`
- `PageHeader`
- `SummaryCard`
- `DataTable`
- `TicketCard`
- `StatusBadge`
- `PriorityBadge`
- `FilterPanel`
- `EmptyState`
- `LoadingState`
- `ConfirmDialog`

## Modelos iniciais do banco

- `User`
- `Client`
- `Ticket`
- `TicketHistory`
- `Attachment`

## Convencoes

- nomes em ingles no codigo
- textos da interface em portugues
- validacao compartilhada com Zod
- regra de negocio em `server/services`
- acesso ao banco em `server/repositories`
- componentes visuais desacoplados da regra de negocio
