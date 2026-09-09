# Log de Desenvolvimento

Registro cronológico de tudo que foi implementado no sistema.
Atualizar este arquivo a cada nova sessão de desenvolvimento.

---

## 2026-09-09 — Recibo de chamado: discriminação completa dos serviços

### Contexto
O recibo em PDF gerado a partir de um chamado saía praticamente vazio: só mostrava o cliente, o número do chamado, o título e o valor total. Não trazia a descrição do chamado, os serviços executados, as ordens de serviço nem as peças aplicadas.

### Causa
`src/app/api/tickets/[id]/recibo/route.ts` montava a lista de itens apenas a partir de `billing.entries` (camada 2 — lançamentos avulsos faturáveis) e ignorava por completo `billing.osContributions` (camada 1 — mão de obra e materiais das OSs concluídas). Como o valor da maioria dos chamados vem das OSs, a tabela "Discriminação dos serviços" ficava vazia e o PDF exibia só o total. O `subtotalAmount` enviado ao PDF também estava incompleto pelo mesmo motivo.

### Implementado

**Rota do recibo do chamado** (`src/app/api/tickets/[id]/recibo/route.ts`)
- Itens agora combinam as duas camadas: mão de obra (`servicePrice`) e cada peça (`parts`) das OSs concluídas que compõem o total, seguidas dos lançamentos avulsos faturáveis
- Quando há mais de uma OS contribuindo, cada linha da tabela recebe o número da OS como referência
- `subtotalAmount` corrigido para `osContributionsTotal + subtotalAmount` (antes o subtotal desconsiderava as OSs, distorcendo a linha de desconto)
- Passa a enviar a descrição do chamado e os dados de execução das OSs (tipo de serviço, técnico, data de conclusão, notas de execução, aprovação do cliente)

**Template do PDF** (`src/lib/receipt-pdf.tsx`)
- Novo bloco "Descrição do chamado"
- Novo bloco "Serviços executados", listando cada OS com número, tipo de serviço, técnico, data de conclusão, notas de execução e nome de quem aprovou
- Novos campos em `ReceiptData`: `referenceDetail` e `serviceOrders` (interface `ReceiptServiceOrder`) — ambos opcionais, então o recibo de venda continua igual
- Bloco de totais e bloco de assinatura marcados com `wrap={false}` para não quebrarem no meio quando o recibo passa para a segunda página

### Verificação
Renderização de PDF de exemplo (chamado com uma OS, mão de obra e peça) conferida visualmente; `tsc --noEmit` sem erros.

### Pendência conhecida
O recibo continua imprimindo `billing.internalNotes` no bloco "Observações" — são notas internas indo para um documento entregue ao cliente. Avaliar trocar por um campo de observações públicas.

---

## 2026-05-22 — Módulo de Locações (novo módulo completo)

### Contexto
Necessidade de controlar contratos de locação de impressoras ZQ521 para clientes: patrimônio de equipamentos, contratos com múltiplos equipamentos, cobranças mensais manuais com controle financeiro integrado.

### Implementado

**Banco de dados**
- Novos enums: `EquipmentStatus` (DISPONIVEL, LOCADO, MANUTENCAO, BAIXADO) e `RentalContractStatus` (RASCUNHO, ATIVO, ENCERRADO, EXPIRADO)
- Novo model `Equipment`: patrimônio de impressoras com serialNumber único, custo de aquisição, código patrimonial
- Novo model `RentalContract`: contrato por cliente com totalMonthlyValue calculado automaticamente, aviso prévio em dias
- Novo model `RentalContractItem`: vincula equipment ao contrato, registra mensalidade individual, data de instalação e devolução
- Novo model `RentalBilling`: cobrança mensal com `FinancialStatus` existente, dueDate, controle de pagamento
- Campo `equipmentId` opcional em `Ticket` para vincular chamados de manutenção ao equipamento locado
- Migração: `20260522140000_add_rental_module`

**Camada de dados**
- `equipment-repository.ts`: CRUD completo, proteção de exclusão se vinculado a contratos
- `rental-repository.ts`: create (transação: cria contrato + itens + marca equipamentos como LOCADO), addItem, returnItem (marca DISPONIVEL e recalcula total), createBilling, updateBillingStatus, deleteBilling
- `mapEquipment`, `mapRentalContractItem`, `mapRentalBilling`, `mapRentalContract` em `mappers.ts`
- `rentalContractInclude` com joins de client, createdBy, items.equipment, billings
- `rental-service.ts`: fachada de serviço

**APIs**
- `GET/POST /api/equipment` — lista e cadastra equipamentos
- `PATCH/DELETE /api/equipment/[id]` — edita e exclui equipamento
- `GET/POST /api/rentals` — lista e cria contratos
- `GET /api/rentals/[id]` — detalhe do contrato
- `PATCH /api/rentals/[id]/status` — muda status do contrato
- `POST /api/rentals/[id]/items` — adiciona equipamento ao contrato
- `PATCH /api/rentals/items/[itemId]/return` — registra devolução
- `POST /api/rentals/[id]/billings` — gera cobrança mensal
- `DELETE /api/rentals/billings/[billingId]` — exclui cobrança pendente
- `PATCH /api/rentals/billings/[billingId]/status` — registra pagamento

**Componentes UI**
- `EquipmentManager` — CRUD de equipamentos com busca, status inline, edição inline, exclusão com confirmação
- `RentalContractForm` — formulário multi-item para novo contrato (seleciona cliente, equipamentos disponíveis, preço por equipamento)
- `RentalStatusActions` — ativar/encerrar contrato com confirmação
- `RentalItemReturn` — registrar devolução de equipamento com data
- `GenerateBillingForm` — gerar cobrança do mês com valor sugerido pelo contrato, vencimento e obs
- `PayBillingButton` — registrar pagamento com forma, data e referência

**Páginas**
- `/locacoes` — lista de contratos com KPIs (ativos, receita mensal, rascunhos, encerrados)
- `/locacoes/[id]` — detalhe com equipamentos ativos, cobranças, devolvidos e sidebar financeiro
- `/locacoes/equipamentos` — gestão do patrimônio com KPIs de disponibilidade

**Navegação**
- Item "Locações" adicionado ao menu com subitens "Contratos" e "Equipamentos"
- Ícone `Printer` (lucide-react)
- Visível para ADMIN e ATTENDANT

---

## 2026-05-22 — Módulo de Estoque (expansão completa)

### Contexto
A página de estoque existia mas estava básica: apenas listagem de posição atual, histórico simples e formulário de entrada. Sessão dedicada a expandir o módulo com todos os recursos necessários para operação real.

### Implementado

**Infraestrutura**
- Migração `20260522120000_add_minimum_stock`: adicionado campo `minimumStock` (opcional) ao model `PartCatalogItem`
- Novo tipo `ListMovementsInput` e resultado paginado `ListMovementsResult` no repositório de estoque
- Método `addAdjustment` no repositório: calcula delta e cria movimentação do tipo `ADJUSTMENT`
- Método `deletePart` no repositório: verifica vínculos antes de excluir (bloqueia se houver movimentações, vendas ou ordens de serviço)
- Serviço `saleService` atualizado com `addStockAdjustment`, `deletePart` e `listMovements` com paginação e filtros

**APIs**
- `POST /api/stock/adjustment` — registra ajuste de estoque (somente ADMIN)
- `DELETE /api/stock/parts/[id]` — exclui material com proteção contra vínculos

**Componentes UI**
- `StockPartsTable` — tabela de posição atual com busca em tempo real por nome/código e botão de exclusão com confirmação inline (ADMIN)
- `StockAdjustmentForm` — formulário de ajuste: exibe saldo atual, solicita nova quantidade e motivo
- `StockMovementsFilters` — filtros de histórico por material, tipo, período (via URL params)
- `StockEntryForm` — substituído `<select>` simples pelo `PartCombobox` com busca

**Página `/estoque`**
- Cards de KPI: materiais ativos, sem estoque, abaixo do mínimo, valor total em estoque
- Alerta de estoque zerado mantido; novo card "Abaixo do mínimo" usa `minimumStock` quando configurado
- Tabela de movimentações exibe responsável (`createdByName`) e observações (`notes`)
- Filtros de histórico por URL params (persiste ao recarregar)
- Paginação no histórico (50 por página, remove o `take: 200` fixo)
- Formulários de entrada e ajuste exibidos lado a lado na sidebar (somente ADMIN)

**Catálogo de Materiais**
- Campo "Estoque mínimo" adicionado ao formulário de cadastro e edição de materiais
- Exibido no modo de visualização junto ao saldo atual

---

## 2026-05-16 — Dashboard Financeiro (reorganização de layout)

- Reorganização do layout do dashboard financeiro
- Ajustes visuais nas seções de cobranças e despesas

---

## 2026-05-15 — Correções e ajustes na página do chamado

- Novo layout da página de detalhe do chamado
- Correções de bugs diversos

---

## 2026-05-14 — App dos técnicos (Field App) e melhorias gerais

- Novo modo app para técnicos (field app) em `/field-app/chamados`
- Ajustes em imagens dos containers Docker
- Correções de bugs no Prisma

---

## 2026-05-13 — Responsividade, uploads e correções

- Ajustes de interface para dispositivos móveis
- Novo upload de anexos nos chamados
- Correções diversas de bugs

---

## 2026-05-12 — Extrato financeiro do cliente e contratos

- Nova área de Extrato Financeiro por cliente em `/financeiro/clientes`
- Upload do QR Code na rota de pagamentos
- Campo de valor editável em contratos
- Redirecionamento pós-criação de chamado
- Correções no módulo financeiro dos chamados
- Ajustes nos campos de busca em várias telas

---

## 2026-05-08–09 — Módulo de Contratos e Despesas Fixas

- Módulo de contratos de clientes (SLA, cobertura, valor mensal)
- Despesas fixas recorrentes com geração automática mensal
- Melhorias de UX em vários formulários
- Correções de bugs em contratos

---

## 2026-05-07 — Módulo de Despesas e Recibos de Vendas

- Novo módulo de despesas operacionais (`/financeiro/despesas`)
- Recibos de venda (PDF/impressão)
- Correções no fluxo de vendas

---

## 2026-05-04–05 — Deploy, segurança e painel do cliente

- Configuração inicial de Dockerfile e docker-compose
- Ajustes de segurança (autenticação, permissões por role)
- Painel do cliente (portal externo)
- Seed de produção

---

## 2026-05-02–04 — Setup inicial e MVP

- Setup inicial do projeto (Next.js 15, Prisma, NextAuth, Tailwind)
- Módulo de autenticação com roles (ADMIN, ATTENDANT, TECHNICIAN, CLIENT)
- Módulo de clientes (CRUD completo com busca, paginação)
- Módulo de chamados (abertura, listagem, filtros, histórico, status, prioridade)
- Módulo de usuários internos
- Dashboard inicial
- Módulo de catálogos (serviços e materiais)
- Módulo de vendas (venda de materiais, itens, status financeiro)
- Módulo financeiro (cobranças, documentos fiscais, instruções de pagamento)
