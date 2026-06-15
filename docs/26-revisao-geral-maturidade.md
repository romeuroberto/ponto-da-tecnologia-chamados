# Revisão Geral de Maturidade do Sistema

Data da revisão: 2026-06-15

## Objetivo

Revisar o sistema contra a documentação e contra o uso operacional real, separando os problemas em etapas para evitar que gaps importantes sejam esquecidos.

## Diagnóstico executivo

O sistema tem uma base ampla já implementada, mas vários fluxos cresceram como trilhas separadas. O usuário precisa alternar entre chamado, venda, extrato, documento fiscal, cobrança e pagamento para concluir rotinas que deveriam acontecer em uma tela operacional única ou em poucos passos.

O problema principal não é ausência total de módulos; é maturidade de fluxo:

- ações importantes aparecem em telas profundas, não na tela onde a pendência é descoberta;
- telas de detalhe nem sempre preservam o contexto de origem;
- pagamento de vendas, chamados, mensalidades e locações usa componentes e regras diferentes;
- agrupamento por nota existe em documentos fiscais, mas ainda não fecha o ciclo de cobrança e pagamento em lote;
- a documentação de simplificação do fluxo ainda não foi plenamente refletida na interface.

## Achados por Área

### 1. Financeiro por cliente e extrato

Arquivos principais:

- `src/app/(dashboard)/financeiro/clientes/page.tsx`
- `src/app/(dashboard)/clientes/[id]/financeiro/page.tsx`
- `src/components/contracts/monthly-billing-list.tsx`
- `src/server/repositories/billing-repository.ts`
- `src/server/repositories/contract-monthly-billing-repository.ts`

Achados:

- O extrato do cliente lista mensalidades, vendas e cobranças de chamados, mas as ações não são uniformes.
- Mensalidade de contrato permite registrar pagamento direto no extrato.
- Venda pendente não permite confirmar pagamento direto no extrato; exige entrar na venda.
- Cobrança de chamado não permite confirmar pagamento direto no extrato; exige entrar no chamado e depois no financeiro do chamado.
- Não existe seleção em lote para registrar vários pagamentos de uma vez.
- Não existe experiência de baixar itens vinculados a uma nota a partir do extrato.
- A tela tem "Voltar ao cliente", mas ao entrar em venda ou chamado o contexto de retorno para o extrato se perde.
- O resumo por cliente considera chamados e vendas, mas precisa ser revisado para consolidar mensalidades de contrato e locações.

### 2. Pagamento, faturamento e documentos fiscais

Arquivos principais:

- `src/app/(dashboard)/financeiro/documentos/page.tsx`
- `src/components/fiscal/fiscal-document-form.tsx`
- `src/components/tickets/ticket-billing-panel.tsx`
- `src/components/sales/sale-actions.tsx`
- `src/components/rentals/rental-billing-actions.tsx`

Achados:

- Documentos fiscais já permitem vincular vários chamados e vendas.
- Esse vínculo não conduz automaticamente o pagamento ou faturamento dos itens vinculados.
- Não há uma tela operacional única para selecionar chamados, vendas e mensalidades, gerar ou vincular nota, registrar pagamento único e baixar todos os itens.
- Venda usa `PENDENTE`, `PAGO`, `CANCELADO`, enquanto chamado usa também `EM_ANALISE`, `APROVADO`, `FATURADO`.
- Ações de pagamento são implementadas de formas diferentes em cada módulo.

### 3. Chamados e financeiro do chamado

Arquivos principais:

- `src/app/(dashboard)/chamados/[id]/page.tsx`
- `src/app/(dashboard)/chamados/[id]/financeiro/page.tsx`
- `src/components/tickets/ticket-billing-panel.tsx`
- `src/server/services/billing-service.ts`
- `docs/22-plano-de-simplificacao-do-fluxo.md`

Achados:

- O financeiro do chamado é funcional, com lançamentos, status, pagamento, recibo e histórico financeiro próprio.
- A tela ainda expõe muitos estados e ações, contrariando parcialmente a direção documentada de simplificar a UX financeira.
- O pagamento de chamado está distante do extrato do cliente, que é onde a pendência costuma ser encontrada.
- A regra de bloquear faturamento ou pagamento antes da conclusão técnica precisa ser revisada para casos de taxa de visita ou cobrança parcial.

### 4. Vendas

Arquivos principais:

- `src/app/(dashboard)/vendas/page.tsx`
- `src/app/(dashboard)/vendas/[id]/page.tsx`
- `src/components/sales/sale-actions.tsx`
- `src/server/services/sale-service.ts`
- `src/server/repositories/sale-repository.ts`

Achados:

- Venda tem confirmação de pagamento no detalhe.
- A tela de detalhe de venda não tem ação explícita de retorno no cabeçalho.
- A venda no extrato do cliente é apenas link, sem ação rápida de pagamento.
- Não há pagamento em lote de vendas.
- Venda não tem etapa `FATURADO`, mas documentos fiscais filtram vendas como `FATURADO`; isso precisa ser verificado.

### 5. Contratos, mensalidades e locações

Arquivos principais:

- `src/components/contracts/monthly-billing-list.tsx`
- `src/app/(dashboard)/locacoes/[id]/page.tsx`
- `src/components/rentals/rental-billing-actions.tsx`
- `src/server/repositories/contract-monthly-billing-repository.ts`
- `src/server/repositories/rental-repository.ts`

Achados:

- Mensalidades de contrato já podem ser pagas direto no extrato do cliente.
- Locações possuem cobranças e pagamento no detalhe da locação, mas não aparecem claramente integradas ao extrato financeiro por cliente.
- Contratos e locações usam conceitos parecidos de mensalidade e cobrança, mas fluxos e componentes diferentes.
- A geração automática de mensalidades existe parcialmente para contratos, mas em locações segue no backlog.

### 6. Navegação e retorno de contexto

Arquivos principais:

- `src/app/(dashboard)/clientes/[id]/financeiro/page.tsx`
- `src/app/(dashboard)/vendas/[id]/page.tsx`
- `src/app/(dashboard)/chamados/[id]/page.tsx`
- `src/app/(dashboard)/chamados/[id]/financeiro/page.tsx`
- `src/app/(dashboard)/locacoes/[id]/page.tsx`

Achados:

- Algumas telas de detalhe possuem botão de voltar; outras não.
- O retorno geralmente é fixo, não preserva origem.
- Fluxos iniciados em "Extrato financeiro" deveriam voltar para o extrato, não apenas para a entidade principal.
- Falta padrão de cabeçalho para telas de detalhe: voltar, ação primária, status e contexto do cliente.

### 7. Permissões e regras de negócio

Arquivos principais:

- `src/server/auth/permissions.ts`
- `src/server/auth/session.ts`
- `src/app/api/**`
- `docs/20-financeiro-mvp.md`
- `docs/23-despesas-e-caixa-mvp.md`

Achados:

- As permissões principais estão coerentes com a documentação: financeiro para `ADMIN` e `ATTENDANT`, técnico sem acesso financeiro.
- Pagamentos e baixas financeiras precisam manter validação no frontend e backend, especialmente se forem levados para o extrato ou para lote.
- As novas ações em lote precisam de transação, auditoria e bloqueio por perfil.

### 8. Documentação vs estado atual

Arquivos principais:

- `docs/20-financeiro-mvp.md`
- `docs/22-plano-de-simplificacao-do-fluxo.md`
- `docs/25-estado-atual-dos-modulos.md`
- `docs/02-requisitos-funcionais.md`
- `docs/05-fluxos-do-sistema.md`

Achados:

- A documentação reconhece a necessidade de simplificar trilha técnica e financeira.
- O sistema implementou mais módulos do que os requisitos funcionais iniciais cobrem.
- `docs/25-estado-atual-dos-modulos.md` está desatualizado em relação ao estado atual do código.
- O status suportado nos docs iniciais ainda cita `RESOLVED`, mas o plano mais novo recomenda ocultar ou reduzir essa etapa na UX.

## Etapas Propostas

### Etapa 1 - Padronizar navegação e retorno de contexto

Status: executada em 2026-06-15.

Escopo:

- criar padrão para cabeçalho de detalhe com botão voltar;
- adicionar retorno em venda, locação e demais detalhes sem volta clara;
- preservar origem via query param `returnTo` quando o usuário sai do extrato;
- ajustar links do extrato para levar `returnTo=/clientes/[id]/financeiro`;
- garantir que chamado, financeiro do chamado e venda respeitem o retorno de origem.

Prioridade: alta.

### Etapa 2 - Ações rápidas no extrato financeiro do cliente

Status: executada em 2026-06-15.

Escopo:

- adicionar "Confirmar pagamento" direto para vendas pendentes;
- adicionar "Confirmar pagamento" direto para cobranças de chamados faturadas ou pendentes quando permitido pela regra;
- manter pagamento direto de mensalidades, mas padronizar visual e validação;
- exibir forma de pagamento, data e referência;
- revalidar páginas relacionadas após a baixa.

Prioridade: alta.

### Etapa 3 - Pagamento em lote e baixa por nota/documento

Status: executada em 2026-06-15.

Escopo:

- permitir selecionar múltiplos itens no extrato;
- mostrar total selecionado;
- registrar forma, data e referência uma vez;
- aplicar baixa em todos os itens selecionados em transação;
- registrar histórico financeiro individual em cada chamado;
- atualizar vendas e mensalidades selecionadas;
- opcionalmente vincular a um documento fiscal existente.

Prioridade: alta.

### Etapa 4 - Consolidar modelo operacional de cobranças

Status: executada parcialmente em 2026-06-15 com abstração de recebíveis na UI/relatórios, mantendo schemas separados.

Escopo:

- revisar se `FinancialStatus` deve continuar compartilhado entre todos os módulos;
- definir uma abstração de "recebível" para a UI, mesmo que o schema continue separado no curto prazo;
- padronizar métodos de pagamento e campos de referência;
- padronizar regras de cancelamento, reversão e auditoria;
- decidir se mensalidades de contrato e locações entram no extrato por cliente e na visão por cliente.

Prioridade: média/alta.

### Etapa 5 - Simplificar UX do chamado e financeiro

Status: executada parcialmente em 2026-06-15 com labels legados ocultados na UX principal.

Escopo:

- reduzir estados financeiros visíveis para `PENDENTE`, `FATURADO`, `PAGO`, `CANCELADO`;
- esconder `EM_ANALISE` e `APROVADO` da UX principal ou mover para auditoria;
- substituir labels antigas de "Resolvido/Encerrado" por "Concluir atendimento" quando aplicável;
- revisar exigência de conclusão técnica antes de faturar ou pagar;
- limitar ações principais por contexto.

Prioridade: média.

### Etapa 6 - Portal do cliente e consistência externa

Status: executada em 2026-06-15.

Escopo:

- validar portal web e portal app para chamados, vendas, documentos e financeiro;
- garantir que pagamento, nota e recibo apareçam de forma coerente;
- revisar mensagens de "pendente", "faturado", "pago" e "cancelado";
- garantir que documentos vinculados a vários itens sejam apresentados de forma compreensível.

Prioridade: média.

### Etapa 7 - Relatórios, dashboard e auditoria

Status: executada parcialmente em 2026-06-15 com dashboard e CSV financeiro consolidados; auditoria detalhada de lote segue como melhoria contínua.

Escopo:

- atualizar dashboard financeiro com vendas, chamados, contratos, locações e despesas;
- incluir recebíveis por período, cliente, status e vencimento;
- exportar CSV dos principais relatórios;
- expor histórico financeiro detalhado em lote e individual;
- atualizar `docs/25-estado-atual-dos-modulos.md`.

Prioridade: média.

### Etapa 8 - Revisão técnica e limpeza

Status: em execução contínua desde 2026-06-15.

Escopo:

- remover duplicações de componentes de pagamento;
- padronizar labels de status;
- revisar comentários e textos com acentuação corrompida;
- confirmar ausência de mock data em páginas conectadas;
- rodar build e testes/smokes relevantes;
- atualizar documentação de rotas e APIs.

Prioridade: contínua.

## Primeiro Corte Recomendado

Para gerar ganho rápido sem grande risco, o primeiro corte deve ser:

1. adicionar retorno de contexto nas telas de venda, chamado financeiro e locação;
2. adicionar pagamento rápido de venda e cobrança de chamado no extrato do cliente;
3. manter a mudança restrita a `ADMIN` e `ATTENDANT`;
4. reusar os serviços existentes de venda e billing;
5. não mexer ainda no schema.

Depois disso, o segundo corte natural é o pagamento em lote.

## Critérios de Aceite

- Usuário consegue sair do extrato, abrir um item e voltar ao mesmo extrato.
- Usuário consegue confirmar pagamento de venda diretamente no extrato.
- Usuário consegue confirmar pagamento de chamado diretamente no extrato quando a regra permitir.
- Pagamentos em lote atualizam todos os itens selecionados ou nenhum, em caso de erro.
- Cada baixa registra auditoria ou histórico correspondente.
- Portal do cliente reflete os novos status.
- Build permanece limpo.
- Permissões seguem a matriz atual: financeiro apenas `ADMIN` e `ATTENDANT`.
