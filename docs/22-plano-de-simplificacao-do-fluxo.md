# Plano de simplificacao do fluxo de chamados e financeiro

## Objetivo

Simplificar o fluxo operacional do sistema sem perder qualidade de dados, rastreabilidade e capacidade futura de crescimento.

Este plano parte do comportamento hoje implementado no codigo e define uma direcao de refatoracao incremental.

## Diagnostico resumido

Hoje o sistema esta funcional, mas o usuario precisa raciocinar sobre tres trilhas ao mesmo tempo:

- chamado tecnico
- ordem de servico
- financeiro

Isso gera:

- excesso de estados intermediarios
- acoes parecidas com nomes diferentes
- duplicidade entre encerramento tecnico e encerramento operacional
- travas inconsistentes no financeiro
- sobrecarga na tela de detalhe do chamado

## Principios da simplificacao

### 1. Um fluxo principal visivel ao usuario

O usuario deve enxergar uma jornada simples:

1. abertura
2. atendimento
3. aguardando cliente, quando necessario
4. conclusao tecnica
5. conclusao financeira, quando aplicavel
6. finalizado

### 2. Menos status, mais metadados

Nem toda etapa importante precisa virar status.

Sempre que possivel, usar:

- timestamps
- historico
- campos de auditoria
- badges auxiliares

em vez de criar novos estados operacionais.

### 3. Separacao entre tecnico e financeiro continua

O chamado continua como centro operacional.

O financeiro continua separado do historico tecnico.

A simplificacao proposta nao mistura modulos, apenas reduz a quantidade de passos visiveis.

### 4. Migracao incremental

Primeiro simplificar UX, labels e regras de transicao.

Depois consolidar tipos e schema, se a operacao validar o novo fluxo.

## Fluxo alvo proposto

## Trilha tecnica visivel

Status tecnicos recomendados para a interface:

- `OPEN`
  - chamado aberto
- `IN_PROGRESS`
  - em atendimento
- `WAITING_CUSTOMER`
  - aguardando retorno do cliente
- `CLOSED`
  - concluido tecnicamente
- `CANCELED`
  - cancelado

## Tratamento do status `RESOLVED`

Direcao recomendada:

- retirar `RESOLVED` da UX principal
- manter internamente apenas durante a transicao, se for necessario para compatibilidade
- no fluxo principal, a equipe deve usar uma unica acao de conclusao tecnica

Leitura sugerida:

- curto prazo:
  - `RESOLVED` continua existindo no banco, mas a interface o trata como estado de pre-fechamento ou o oculta
- medio prazo:
  - migrar operacao para usar apenas `CLOSED` como conclusao tecnica

## Trilha financeira visivel

Status financeiros recomendados para a interface:

- `PENDENTE`
  - financeiro ainda em montagem
- `FATURADO`
  - cobranca emitida ou registrada
- `PAGO`
  - recebido
- `CANCELADO`
  - ciclo financeiro encerrado sem cobranca

## Tratamento de `EM_ANALISE` e `APROVADO`

Direcao recomendada:

- remover do fluxo principal exibido ao usuario
- substituir por metadados de controle, quando necessario

Campos candidatos:

- `reviewedAt`
- `reviewedById`
- `approvedAt`
- `approvedById`

No curto prazo:

- manter os enums por compatibilidade
- esconder essas etapas no painel principal
- expor apenas em historico ou auditoria

## Fluxo alvo consolidado

### 1. Abertura

Campos essenciais:

- cliente
- titulo
- descricao
- categoria
- prioridade
- solicitante
- tipo de atendimento

Campos opcionais na abertura:

- responsavel
- email do solicitante

### 2. Atendimento

Acoes principais:

- atribuir responsavel
- registrar comentarios
- anexar arquivos
- registrar check-in/check-out quando visita externa

### 3. Espera do cliente

Uso apenas quando realmente houver dependencia de retorno do cliente.

Evitar usar como "pausa generica".

### 4. Conclusao tecnica

Acao principal visivel:

- `Concluir atendimento`

Essa acao deve:

- encerrar a trilha tecnica
- registrar data de conclusao
- orientar o usuario para o financeiro apenas se houver cobranca

### 5. Conclusao financeira

Acao principal:

- revisar valores e registrar cobranca

Fluxo ideal:

1. montar lancamentos
2. aplicar desconto, se houver
3. definir tipo de cobranca
4. registrar faturamento, se aplicavel
5. registrar pagamento, quando recebido

### 6. Finalizacao

O chamado fica totalmente finalizado quando:

- tecnico concluido
- financeiro pago, cancelado ou dispensado

## Regras novas recomendadas

## Regra 1. Fechamento tecnico com unica decisao

Substituir a dupla:

- resolver
- encerrar

por uma unica decisao principal:

- concluir atendimento

Excecoes:

- cancelamento
- reabertura

## Regra 2. Motivo obrigatorio apenas para cancelamento

Hoje o sistema exige motivo tambem em encerramento normal.

Direcao:

- `closingReason` obrigatorio apenas para `CANCELED`
- para fechamento normal, usar comentario final ou resumo tecnico

## Regra 3. Financeiro com menos estados visiveis

O usuario nao deve decidir entre:

- aprovar
- aprovar e faturar
- pagar direto
- cancelar
- reabrir

em um mesmo nivel de importancia.

Direcao:

- mostrar acoes conforme contexto
- esconder passos de controle interno
- expor no maximo duas proximas acoes principais por vez

## Regra 4. Travamento financeiro consistente

Hoje os lancamentos travam em `APROVADO`, mas o resumo ainda pode mudar.

Direcao:

- ao faturar, travar:
  - lancamentos
  - desconto
  - tipo de cobranca
- qualquer correcao posterior deve ocorrer por:
  - reabertura do financeiro
  - cancelamento e reinicio do ciclo

## Regra 5. Contrato, garantia e cortesia nao devem parecer pendencia de cobranca

Chamados:

- `CONTRATO`
- `GARANTIA`
- `CORTESIA`

podem ter custo interno sem gerar percepcao de "financeiro atrasado".

Direcao:

- diferenciar "controle interno" de "cobranca ao cliente"
- permitir total zero sem parecer erro

## Regra 6. Ordem de servico opcional e enxuta

A OS deve ser camada complementar, nao trilha paralela obrigatoria.

Uso recomendado:

- apenas em atendimentos fisicos
- apenas quando houver planejamento, execucao em campo ou consumo de material que justifique o registro

Status recomendados:

- `PLANNED`
- `IN_EXECUTION`
- `COMPLETED`
- `CANCELED`

Direcao:

- `PAUSED` vira observacao ou historico, nao estado principal do MVP

## Regra 7. Uma OS por chamado como experiencia padrao

Mesmo que o banco aceite varias OS:

- a interface pode assumir uma OS principal por chamado
- cenarios com varias OS podem ficar como capacidade avancada

Isso reduz muito a complexidade percebida.

## Campos: o que manter, mover ou reduzir

## Manter como essenciais no chamado

- `clientId`
- `title`
- `description`
- `category`
- `attendanceType`
- `priority`
- `requesterName`
- `assigneeId`
- `status`
- `createdAt`
- `updatedAt`

## Manter, mas tratar como auditoria

- `resolvedAt`
- `closedAt`
- `checkedInAt`
- `checkedOutAt`
- `closingReason`

## Rever obrigatoriedade ou momento de captura

- `requesterEmail`
  - pode continuar opcional
- `assigneeId`
  - melhor como opcional na abertura
- `customerApprovalName` e `customerApprovalAt` da OS
  - avancado, nao obrigatorio no fluxo base

## Manter no financeiro

- `billingType`
- `financialStatus`
- `subtotalAmount`
- `discountAmount`
- `totalAmount`
- `internalNotes`
- `invoiceNumber`
- `invoiceDueDate`
- `paymentMethod`
- `paymentDate`
- `paymentReference`
- `cancellationReason`

## Converter de status para metadado, quando possivel

- aprovacao interna do financeiro
- revisao interna do financeiro
- pausas operacionais da OS

## Proposta de UX simplificada

## Detalhe do chamado

Dividir a experiencia em 4 blocos claros:

1. resumo
2. andamento tecnico
3. financeiro
4. historico

Direcoes:

- mostrar uma unica proxima acao principal
- reduzir verbos concorrentes
- esconder acoes avancadas dentro de secoes secundarias

## Acoes tecnicas

Trocar o painel atual por algo mais direto:

- iniciar atendimento
- aguardar cliente
- concluir atendimento
- cancelar chamado
- reabrir chamado

Sem expor `RESOLVED` e `CLOSED` como escolha operacional separada.

## Acoes financeiras

Trocar o painel atual por algo orientado a etapa:

- montar valores
- registrar cobranca
- confirmar pagamento
- cancelar financeiro

Se o tipo for `CORTESIA`, `CONTRATO` coberto ou `GARANTIA`:

- mostrar CTA contextual como:
  - `Encerrar sem cobranca`
  - `Registrar apenas custo interno`

## Ordem de servico

Deixar a OS em modo progressivo:

- resumo enxuto por padrao
- detalhes expandidos sob demanda

Na criacao:

- tecnico
- servico
- materiais
- observacoes

Ocultar inicialmente:

- datas detalhadas
- aprovacao do cliente
- controles menos usados

## Roadmap de execucao

## Fase 1. Simplificacao de UX sem quebrar schema

Objetivo:

- reduzir complexidade percebida sem migracao de banco

Entregas:

- esconder `RESOLVED` do fluxo principal
- consolidar "resolver" e "encerrar" em uma acao principal
- remover `EM_ANALISE` e `APROVADO` da leitura principal do financeiro
- reorganizar CTAs do painel financeiro
- ajustar textos de resumo e badges

Arquivos principais:

- `src/lib/ticket-flow.ts`
- `src/components/tickets/ticket-flow-actions.tsx`
- `src/components/tickets/ticket-detail-actions.tsx`
- `src/components/tickets/ticket-flow-overview.tsx`
- `src/components/tickets/ticket-billing-panel.tsx`
- `src/app/(dashboard)/chamados/[id]/page.tsx`

## Fase 2. Regras de negocio e validacoes

Objetivo:

- alinhar comportamento interno ao fluxo simplificado

Entregas:

- exigir motivo apenas em cancelamento
- revisar transicoes tecnicas
- padronizar travas financeiras
- orientar conclusao tecnica conforme tipo de cobranca

Arquivos principais:

- `src/lib/validations/ticket-actions.ts`
- `src/lib/validations/billing.ts`
- `src/lib/billing-rules.ts`
- `src/server/services/ticket-service.ts`
- `src/server/repositories/ticket-repository.ts`
- `src/server/repositories/billing-repository.ts`
- `src/app/api/tickets/[id]/route.ts`
- `src/app/api/tickets/[id]/billing/route.ts`

## Fase 3. Enxugamento da ordem de servico

Objetivo:

- reduzir a OS a uma camada complementar

Entregas:

- simplificar status da OS na interface
- esconder campos avancados por padrao
- tratar uma OS como experiencia padrao
- reduzir ruído visual no detalhe do chamado

Arquivos principais:

- `src/components/tickets/ticket-service-orders-panel.tsx`
- `src/server/services/service-order-service.ts`
- `src/server/repositories/service-order-repository.ts`
- `src/types/index.ts`

## Fase 4. Consolidacao de tipos e schema

Objetivo:

- limpar estados herdados depois de validar operacao

Entregas candidatas:

- revisar enum `TicketStatus`
- revisar enum `FinancialStatus`
- migrar dados existentes
- ajustar relatorios e dashboard

Arquivos principais:

- `prisma/schema.prisma`
- `src/types/index.ts`
- `src/server/services/dashboard-service.ts`
- `src/server/services/report-service.ts`
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/financeiro/page.tsx`
- `src/app/(dashboard)/financeiro/cobrancas/page.tsx`

## Impacto tecnico por modulo

## Chamados

Mudancas:

- simplificar transicoes
- reduzir verbos duplicados
- deixar `CLOSED` como principal status de conclusao tecnica

Risco:

- baixo a medio

Observacao:

- o codigo atual ja suporta reabertura e historico, o que ajuda bastante na migracao

## Financeiro

Mudancas:

- simplificar estados visiveis
- bloquear resumo e lancamentos de forma coerente
- separar melhor controle interno de cobranca externa

Risco:

- medio

Observacao:

- relatorios e dashboard usam os enums atuais, entao a simplificacao de UX deve vir antes da mudanca estrutural

## Ordem de servico

Mudancas:

- reduzir profundidade da UI
- manter dados, mas esconder o que nao for essencial

Risco:

- baixo

Observacao:

- o modelo atual e rico; a simplificacao deve ser mais de experiencia do que de exclusao de dados

## Relatorios e dashboard

Mudancas:

- revisar agrupamentos por status
- revisar o que conta como concluido
- revisar a leitura de pendencias financeiras

Risco:

- medio

## Recomendacao final

Seguir nesta ordem:

1. simplificar UX e labels
2. alinhar validacoes e regras
3. simplificar OS
4. consolidar enums e schema

Essa ordem preserva estabilidade, reduz risco e permite validar a operacao real antes de mudar o banco.

## Proxima etapa recomendada

Executar primeiro a Fase 1 e a Fase 2 juntas em um unico ciclo de refatoracao.

Elas entregam o maior ganho de clareza com o menor risco estrutural.
