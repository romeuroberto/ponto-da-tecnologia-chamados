# Financeiro MVP

## Objetivo

Adicionar uma camada financeira simples ao sistema de chamados, sem misturar controle tecnico com faturamento.

O financeiro deve permitir:

- classificar o chamado como faturavel ou nao
- registrar horas, pecas, deslocamento e extras
- calcular subtotal, desconto e total
- acompanhar status financeiro
- listar chamados pendentes de faturamento e cobranca

## Principio de modelagem

O chamado continua sendo o centro operacional.

A parte financeira fica vinculada ao chamado, mas separada em sua propria estrutura.

Nao usar o proprio historico tecnico para guardar itens financeiros.

Nao depender de check-in/check-out no MVP.

## Escopo do MVP

### 1. Classificacao financeira do chamado

Cada chamado deve ter um resumo financeiro com:

- `billingType`
  - `AVULSO`
  - `CONTRATO`
  - `GARANTIA`
  - `CORTESIA`
- `financialStatus`
  - `PENDENTE`
  - `EM_ANALISE`
  - `APROVADO`
  - `FATURADO`
  - `PAGO`
  - `CANCELADO`
- `discountAmount`
- `subtotalAmount`
- `totalAmount`
- `internalNotes`

### 2. Lancamentos financeiros

Cada chamado pode ter varios lancamentos.

Tipos de lancamento:

- `LABOR`
- `PART`
- `TRAVEL`
- `EXTRA`

Campos por lancamento:

- `description`
- `quantity`
- `unitPrice`
- `totalPrice`
- `billable`
- `createdById`

### 3. Regras comerciais simples

Cada cliente pode opcionalmente ter uma regra comercial basica.

Campos minimos:

- `defaultBillingType`
- `hourlyRate`
- `travelRate`
- `defaultDiscountPercent`
- `hasActiveContract`
- `contractNotes`

No MVP, isso serve apenas como apoio ao preenchimento.

Nao precisa calcular franquia de horas ainda.

## Modelagem sugerida

### Tabela `TicketBilling`

Um registro por chamado.

Campos:

- `id`
- `ticketId` unique
- `billingType`
- `financialStatus`
- `subtotalAmount`
- `discountAmount`
- `totalAmount`
- `internalNotes`
- `approvedAt`
- `invoicedAt`
- `paidAt`
- `createdAt`
- `updatedAt`

### Tabela `BillingEntry`

Varios registros por chamado.

Campos:

- `id`
- `ticketBillingId`
- `entryType`
- `description`
- `quantity`
- `unitPrice`
- `totalPrice`
- `billable`
- `createdById`
- `createdAt`
- `updatedAt`

### Tabela `ClientBillingProfile`

Um perfil financeiro por cliente.

Campos:

- `id`
- `clientId` unique
- `defaultBillingType`
- `hourlyRate`
- `travelRate`
- `defaultDiscountPercent`
- `hasActiveContract`
- `contractNotes`
- `createdAt`
- `updatedAt`

## Regras de negocio

### Regra 1

Chamado pode existir sem financeiro.

O financeiro deve ser criado sob demanda ao abrir ou encerrar o chamado.

### Regra 2

Chamados `GARANTIA` e `CORTESIA` podem ter lancamentos, mas total final pode ser zero.

### Regra 3

`subtotalAmount` = soma de todos os lancamentos faturaveis.

### Regra 4

`totalAmount` = `subtotalAmount - discountAmount`.

Nunca permitir total negativo.

### Regra 5

Somente `ADMIN` e `ATTENDANT` podem editar dados financeiros no MVP.

`TECHNICIAN` nao altera faturamento.

### Regra 6

Mudanca de `financialStatus` deve registrar historico financeiro proprio.

Nao misturar com `TicketHistory`.

### Regra 7

Chamado pode ser encerrado tecnicamente sem estar faturado.

Fluxo tecnico e fluxo financeiro sao independentes.

## Fluxo recomendado

### Fluxo 1. Chamado avulso

1. chamado e encerrado tecnicamente
2. usuario abre a aba financeira
3. informa tipo `AVULSO`
4. adiciona horas e pecas
5. sistema calcula subtotal e total
6. financeiro vai para `APROVADO` ou `FATURADO`

### Fluxo 2. Chamado por contrato

1. chamado usa tipo `CONTRATO`
2. lancamentos podem existir para controle interno
3. total pode ser zero ou apenas informativo
4. status financeiro acompanha auditoria e conferencia

### Fluxo 3. Garantia ou cortesia

1. chamado recebe tipo `GARANTIA` ou `CORTESIA`
2. pode registrar horas e pecas para custo interno
3. total faturado ao cliente pode permanecer zero

## Telas do MVP

### No detalhe do chamado

Adicionar um bloco ou aba `Financeiro` com:

- tipo de cobranca
- status financeiro
- lista de lancamentos
- botao `Adicionar lancamento`
- subtotal
- desconto
- total
- observacoes internas

### Em relatorios

Adicionar relatorios simples:

- chamados faturaveis pendentes
- total por tipo de cobranca
- total faturado por periodo
- total pendente por cliente

## API sugerida

### `GET /api/tickets/[id]/billing`

Retorna resumo financeiro do chamado.

### `POST /api/tickets/[id]/billing`

Cria ou atualiza o resumo financeiro do chamado.

### `POST /api/tickets/[id]/billing/entries`

Cria um lancamento financeiro.

### `PUT /api/tickets/[id]/billing/entries/[entryId]`

Atualiza um lancamento.

### `DELETE /api/tickets/[id]/billing/entries/[entryId]`

Remove um lancamento.

## Ordem recomendada de implementacao

### Etapa 1

- schema Prisma
- enums financeiros
- `TicketBilling`
- `BillingEntry`

### Etapa 2

- repositories e services
- calculo automatico de subtotal e total
- permissoes financeiras

### Etapa 3

- UI do bloco financeiro no detalhe do chamado
- criacao e edicao de lancamentos

### Etapa 4

- filtros e relatorios financeiros

## Fora do MVP

Nao implementar agora:

- emissao de nota fiscal
- contas a receber completas
- parcelamento
- integracao com ERP
- check-in/check-out financeiro
- franquia contratual complexa
- centro de custo
- comissao

## Recomendacao final

Para este projeto, a melhor abordagem e:

- manter financeiro separado do historico tecnico
- usar lancamentos manuais no MVP
- permitir contratos simples por cliente
- calcular total automaticamente
- controlar status financeiro de forma independente do status do chamado

Isso deixa o modulo pequeno, versatil e pronto para crescer depois sem retrabalho estrutural.
