# Especificacao de API

## Padrao geral

- estilo REST
- respostas em JSON
- autenticacao para rotas protegidas
- versionamento inicial sugerido: `/api/v1`

## Endpoints principais

### Autenticacao

#### POST `/api/v1/auth/login`

Entrada:

- email
- senha

Saida:

- dados basicos do usuario autenticado
- token ou sessao estabelecida

#### POST `/api/v1/auth/logout`

Saida:

- confirmacao de logout

### Usuarios

#### GET `/api/v1/users`

Lista usuarios conforme permissao.

#### POST `/api/v1/users`

Cria usuario interno.

#### GET `/api/v1/users/{id}`

Retorna detalhe de usuario.

#### PUT `/api/v1/users/{id}`

Atualiza usuario.

### Clientes

#### GET `/api/v1/clients`

Lista clientes com filtros e busca.

#### POST `/api/v1/clients`

Cria cliente.

#### GET `/api/v1/clients/{id}`

Retorna detalhe do cliente.

#### PUT `/api/v1/clients/{id}`

Atualiza cliente.

### Chamados

#### GET `/api/v1/tickets`

Lista chamados com filtros por cliente, status, prioridade, responsavel, periodo e busca textual.

#### POST `/api/v1/tickets`

Cria novo chamado.

Campos principais:

- clientId
- title
- description
- category
- priority
- requesterName
- requesterEmail

#### GET `/api/v1/tickets/{id}`

Retorna detalhe completo do chamado.

#### PUT `/api/v1/tickets/{id}`

Atualiza dados editaveis do chamado.

### Acoes em chamados

#### PATCH `/api/v1/tickets/{id}/status`

Altera status do chamado.

#### PATCH `/api/v1/tickets/{id}/priority`

Altera prioridade do chamado.

#### PATCH `/api/v1/tickets/{id}/assignee`

Altera responsavel pelo chamado.

#### POST `/api/v1/tickets/{id}/comments`

Adiciona comentario ou tratativa ao historico.

#### POST `/api/v1/tickets/{id}/attachments`

Envia anexo para o chamado.

#### POST `/api/v1/tickets/{id}/close`

Encerra o chamado.

#### POST `/api/v1/tickets/{id}/reopen`

Reabre o chamado.

### Dashboard

#### GET `/api/v1/dashboard/summary`

Retorna indicadores principais para a tela inicial.

### Exportacao

#### GET `/api/v1/reports/tickets/export`

Exporta listagem de chamados com filtros.

## Regras de resposta

- usar codigos HTTP padronizados
- retornar mensagens claras em erros de validacao
- retornar identificadores e metadados relevantes
- manter formato consistente entre endpoints

## Estrutura de resposta sugerida

### Sucesso

- `success`
- `data`
- `message`

### Erro

- `success`
- `message`
- `errors`

## Validacoes importantes

- cliente obrigatorio na abertura do chamado
- prioridade obrigatoria
- status valido
- usuario com permissao para executar a acao
- campos obrigatorios preenchidos
