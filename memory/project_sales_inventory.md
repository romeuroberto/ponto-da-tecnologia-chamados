---
name: Módulo de Vendas e Estoque
description: Arquitetura, regras de negócio e decisões do módulo de vendas simples com controle de estoque
type: project
---

Módulo de vendas simples com controle de estoque integrado ao financeiro existente.

**Why:** Complementa o módulo financeiro, aproveita o catálogo de peças já existente e dá controle de quem comprou, quem pagou e débitos em aberto — sem parte fiscal.

**How to apply:** Ao implementar, seguir rigorosamente a arquitetura de StockMovement como camada central para não duplicar lógica de baixa de estoque.

---

## Decisões de negócio

- Vendas **somente para clientes já cadastrados** no sistema (sem cadastro avulso de comprador)
- Sem nota fiscal ou parte fiscal — apenas controle interno
- Estoque simples: quantidade atual por item do catálogo de peças (`PartCatalogItem`)

---

## Arquitetura central: StockMovement

`StockMovement` é o registro unificado de toda movimentação de estoque. Dois caminhos geram movimentações:
1. **Saída por venda** — quando uma `Sale` é confirmada
2. **Saída por OS** — quando um `ServiceOrderPart` é registrado numa ordem de serviço

Sem essa camada central, OS e vendas ficariam dessincronizados.

```
StockMovement
  id
  partCatalogItemId   → PartCatalogItem
  type                ENTRY | SALE_EXIT | SERVICE_ORDER_EXIT | ADJUSTMENT
  quantity            Decimal
  referenceId         String?   (saleId ou serviceOrderPartId)
  notes               String?
  createdById         → User
  createdAt
```

`PartCatalogItem` ganha campo `stockQuantity Decimal @default(0)` — atualizado via trigger ou recalculado dos movimentos.

---

## Modelo Sale

```
Sale
  id
  number              String @unique  (ex: VD-2026-001)
  clientId            → Client
  financialStatus     FinancialStatus  (mesmo enum já existente: PENDENTE→PAGO/CANCELADO)
  paymentMethod       String?
  paymentDate         DateTime?
  paymentReference    String?
  internalNotes       String?
  totalAmount         Decimal
  createdById         → User
  createdAt / updatedAt
  items               SaleItem[]
  movements           StockMovement[]

SaleItem
  id
  saleId              → Sale
  partCatalogItemId   → PartCatalogItem
  partName            String   (snapshot no momento da venda)
  partCode            String?
  quantity            Decimal
  unitPrice           Decimal  (snapshot no momento da venda)
  totalPrice          Decimal
```

---

## Fluxo financeiro da venda

Simplificado (sem aprovação intermediária, diferente do TicketBilling):
`PENDENTE → PAGO` ou `PENDENTE → CANCELADO`

Cancelamento reverte a movimentação de estoque (cria movimento ADJUSTMENT positivo).

---

## Navegação planejada

- `/vendas` — lista de vendas com filtros (status, cliente, período) + métricas (total, inadimplentes)
- `/vendas/nova` — formulário de nova venda (seleciona cliente → adiciona itens → confirma)
- `/vendas/[id]` — detalhe da venda com histórico e ações financeiras
- `/estoque` — visão do estoque atual por item (quantidade, últimas movimentações)
- Sidebar: novo grupo "Vendas" com sub-itens "Vendas" e "Estoque"

---

## Fases de implementação

1. **Schema + migração:** `stockQuantity` no `PartCatalogItem`, `StockMovement`, `Sale`, `SaleItem`
2. **Repositórios + serviços:** saleRepository, stockRepository, saleService (cria venda + gera movements)
3. **Integração com OS:** ao criar `ServiceOrderPart`, gerar `StockMovement` de saída automaticamente
4. **Páginas:** `/vendas`, `/vendas/nova`, `/vendas/[id]`, `/estoque`
5. **Sidebar:** adicionar grupo Vendas
