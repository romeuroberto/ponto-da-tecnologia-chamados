# Despesas e Caixa MVP

## Objetivo

Adicionar ao modulo financeiro o controle manual de despesas e uma visao basica de caixa, sem misturar despesas com o historico tecnico do chamado.

## Escopo do MVP

- cadastrar despesa
- editar despesa
- cancelar despesa
- marcar despesa como paga
- listar despesas com filtros
- vincular despesa opcionalmente a um chamado
- exibir resumo simples de caixa no dashboard financeiro

## Modelo minimo

Entidade principal: `Expense`

Campos:

- `description`
- `category`
- `amount`
- `status`
- `expenseDate`
- `paidAt`
- `paymentMethod`
- `notes`
- `ticketId`
- `createdById`
- `cancellationReason`
- `canceledAt`
- `createdAt`
- `updatedAt`

Enums:

- `ExpenseStatus`: `PENDENTE`, `PAGA`, `CANCELADA`
- `ExpenseCategory`: `ALUGUEL`, `ENERGIA`, `INTERNET`, `TRANSPORTE`, `COMBUSTIVEL`, `ALIMENTACAO`, `PECAS_INSUMOS`, `FERRAMENTAS_EQUIPAMENTOS`, `IMPOSTOS_TAXAS`, `SERVICOS_TERCEIROS`, `OUTROS`

## Regras de negocio

- nova despesa nasce como `PENDENTE`
- valor deve ser maior que zero
- despesa `PAGA` impacta o caixa realizado
- despesa `PENDENTE` nao impacta o caixa realizado
- despesa `CANCELADA` nao impacta o caixa
- cancelamento exige motivo
- despesa cancelada nao pode ser paga
- despesa paga nao deve ser cancelada no fluxo normal
- vinculo com chamado e apenas analitico
- vinculo com chamado nao altera `TicketBilling`

## Permissoes

- `ADMIN`: visualizar, criar, editar, pagar e cancelar despesas
- `ATTENDANT`: visualizar, criar, editar, pagar e cancelar despesas
- `TECHNICIAN`: sem acesso ao modulo de despesas/caixa

## API minima

- `GET /api/expenses`
- `POST /api/expenses`
- `PATCH /api/expenses/[id]`
- `POST /api/expenses/[id]/pay`
- `POST /api/expenses/[id]/cancel`

## UI minima

- pagina `Financeiro > Despesas`
- formulario de criacao
- listagem com filtros por periodo, status, categoria, vinculo e busca textual
- acoes de editar, pagar e cancelar
- resumo de despesas e caixa no dashboard financeiro

## Validacao minima

- validar permissao no frontend e backend
- validar campos obrigatorios
- validar transicoes de status
- validar build com `npm.cmd run build`

## Observacao de ambiente

- neste projeto o banco nao roda localmente fora de container
- o PostgreSQL utilizado pela aplicacao roda no Docker Desktop
- migrations de `Expense` e demais validacoes de banco devem ser executadas considerando esse ambiente
