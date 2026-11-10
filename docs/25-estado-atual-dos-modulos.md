# Estado Atual dos Módulos

Snapshot da situação de cada módulo do sistema. Atualizar após cada sessão.
Última atualização: 2026-11-10 (testes com Vitest, CI no GitHub Actions e prints no README)

---

## Legenda

- ✅ Implementado e funcional
- 🔧 Parcialmente implementado / precisa de melhorias
- ❌ Não implementado
- 🚧 Em desenvolvimento

---

## Autenticação e Segurança

| Recurso | Status | Observações |
|---|---|---|
| Login com email/senha | ✅ | NextAuth com credentials |
| Roles: ADMIN, ATTENDANT, TECHNICIAN, CLIENT | ✅ | |
| Proteção de rotas por role | ✅ | `requireRole` no servidor |
| Sessão persistente | ✅ | |
| Recuperação de senha | ❌ | Não prevista no MVP |

---

## Clientes

| Recurso | Status | Observações |
|---|---|---|
| Cadastro e edição | ✅ | |
| Listagem com busca e paginação | ✅ | |
| Perfil de cobrança por cliente | ✅ | Tipo de cobrança, taxa horária |
| Extrato financeiro do cliente | ✅ | Consolidado com chamados, vendas, mensalidades e locações; pagamento rápido e lote |
| Portal do cliente (acesso externo) | ✅ | Login com role CLIENT, financeiro, documentos, vendas e abertura de chamados |
| Inativação | ✅ | |

---

## Chamados

| Recurso | Status | Observações |
|---|---|---|
| Abertura de chamado | ✅ | |
| Listagem com filtros avançados | ✅ | Busca, status, prioridade, cliente, período, ordenação |
| Atribuição de responsável | ✅ | |
| Atualização de status | ✅ | OPEN → IN_PROGRESS → WAITING_CUSTOMER → WAITING_PARTS → CLOSED |
| Histórico de interações | ✅ | |
| Prioridade | ✅ | LOW, MEDIUM, HIGH, CRITICAL |
| Anexos | ✅ | Upload de arquivos |
| Ordens de Serviço (OS) | ✅ | Vinculadas ao chamado |
| Aprovação do cliente na OS | ✅ | Campo de assinatura/nome |
| Fechamento com motivo | ✅ | |
| SLA de peças aguardando | ✅ | Cronômetro de `WAITING_PARTS` |
| Notificações por e-mail | ❌ | Backlog |
| Abertura pelo cliente externo | ✅ | Portal web e portal app possuem abertura de chamado |

---

## Usuários Internos

| Recurso | Status | Observações |
|---|---|---|
| Listagem e busca | ✅ | |
| Criação de usuário | ✅ | |
| Edição e inativação | ✅ | |
| Permissões por role | ✅ | |

---

## Catálogos

| Recurso | Status | Observações |
|---|---|---|
| Serviços (cadastro, edição, busca) | ✅ | Código automático SRV-XXXX |
| Materiais (cadastro, edição, busca) | ✅ | Código automático PEC-XXXX |
| Campo estoque mínimo | ✅ | Adicionado em 2026-05-22 |
| Preço de revenda | ✅ | Campo opcional |
| Inativação de itens | ✅ | |

---

## Estoque

| Recurso | Status | Observações |
|---|---|---|
| Posição atual (tabela com busca) | ✅ | Filtro client-side por nome/código |
| Entrada de materiais | ✅ | Formulário com PartCombobox |
| Ajuste de estoque (ADJUSTMENT) | ✅ | Define nova quantidade; delta calculado automaticamente |
| Exclusão de material | ✅ | Protegida contra materiais com vínculos |
| Filtros no histórico | ✅ | Por material, tipo, período |
| Histórico com responsável e observações | ✅ | |
| Paginação no histórico | ✅ | 50 por página |
| Cards de KPI (ativos, sem estoque, valor) | ✅ | |
| Alerta de estoque mínimo | ✅ | Usa `minimumStock`; fallback para zero |
| Exportação CSV | ❌ | Backlog |

---

## Vendas

| Recurso | Status | Observações |
|---|---|---|
| Criação de venda (materiais) | ✅ | |
| Listagem com filtros | ✅ | |
| Atualização de status financeiro | ✅ | PENDENTE, PAGO, CANCELADO; pagamento rápido pelo extrato |
| Recibo de venda (impressão) | ✅ | |
| Baixa automática no estoque | ✅ | Movimentação `SALE_EXIT` |
| Vínculo com documento fiscal | ✅ | Manual e via baixa em lote |

---

## Financeiro

| Recurso | Status | Observações |
|---|---|---|
| Cobranças de chamados | ✅ | Faturamento vinculado à OS |
| Despesas operacionais | ✅ | Cadastro manual, categorias |
| Despesas fixas recorrentes | ✅ | Geração automática mensal |
| Documentos fiscais (NF) | ✅ | Upload de PDF e vínculo com chamados, vendas, mensalidades e locações |
| Instruções de pagamento (PIX, boleto) | ✅ | Upload de QR Code |
| Dashboard financeiro | ✅ | Recebíveis consolidados, despesas, caixa, status e CSV |
| Extrato por cliente | ✅ | Ações rápidas, pagamento em lote e vínculo fiscal |
| Relatórios avançados | ✅ | Relatórios operacional/financeiro com exportação CSV |
| Recibo PDF de chamado | ✅ | Discrimina mão de obra e peças das OSs concluídas + lançamentos avulsos, com descrição do chamado e notas de execução |

---

## Contratos

| Recurso | Status | Observações |
|---|---|---|
| Cadastro de contratos por cliente | ✅ | |
| Tipos de cobertura | ✅ | |
| Valor mensal | ✅ | |
| Vínculo com chamados | ✅ | |
| Renovação automática | ❌ | Backlog |

---

## Locações de Equipamentos (novo)

| Recurso | Status | Observações |
|---|---|---|
| Cadastro de equipamentos (patrimônio) | ✅ | Modelo, série, código patrimonial, custo |
| Status de equipamento | ✅ | DISPONIVEL, LOCADO, MANUTENCAO, BAIXADO |
| KPIs de equipamentos | ✅ | Total, disponíveis, locados, manutenção |
| Criação de contrato de locação | ✅ | Multi-equipamento, aviso prévio, data de término |
| Múltiplos equipamentos por contrato | ✅ | Preço individual por equipamento |
| Atualização de total mensal automática | ✅ | Recalculado ao devolver equipamento |
| Ativação / encerramento de contrato | ✅ | Com confirmação |
| Registro de devolução de equipamento | ✅ | Atualiza status do equipamento automaticamente |
| Geração manual de cobrança mensal | ✅ | Valor sugerido, vencimento, obs |
| Registro de pagamento | ✅ | Forma de pagamento, data, referência |
| Exclusão de cobrança pendente | ✅ | Protegida para cobranças já pagas |
| Sidebar financeiro no detalhe | ✅ | Mensalidade, total cobrado, recebido, em aberto |
| Vínculo chamado ↔ equipamento | ✅ | Campo `equipmentId` no Ticket (schema pronto) |
| Geração automática de cobranças | ❌ | Backlog — por ora é manual |
| Recibo PDF de cobrança | ❌ | Backlog |
| Dashboard com receita de locações | ✅ | Integrado ao dashboard financeiro, relatórios e extrato do cliente |

---

## Field App (Técnicos)

| Recurso | Status | Observações |
|---|---|---|
| Lista de chamados do técnico | ✅ | `/field-app/chamados` |
| Atualização de status pelo técnico | ✅ | |
| Check-in / check-out | ✅ | |
| Interface responsiva para celular | ✅ | |

---

## Dashboard

| Recurso | Status | Observações |
|---|---|---|
| Cards de resumo (chamados, financeiro) | ✅ | |
| Chamados recentes | ✅ | |
| Indicadores financeiros | ✅ | Recebíveis consolidados por status, tipo e cliente |
| Gráficos / relatórios avançados | ✅ | Dashboard financeiro e relatórios CSV |

---

## Empresa

| Recurso | Status | Observações |
|---|---|---|
| Perfil da empresa (dados, logo) | ✅ | `/empresa` |
| Assinatura digital | ✅ | |

---

## Infraestrutura / Deploy

| Recurso | Status | Observações |
|---|---|---|
| Docker + docker-compose | ✅ | Banco PostgreSQL na porta 5434 |
| Variáveis de ambiente via `.env.local` | ✅ | |
| Prisma Migrate | ✅ | Migrações versionadas em `prisma/migrations/` |
| Seed de desenvolvimento | ✅ | `prisma/seed.dev.js` |
| Deploy em produção | 🔧 | `docker-compose.prod.yml` existe; validar ambiente |
| Lint (ESLint) | ✅ | Flat config nativo do `eslint-config-next` 16; 0 erros, avisos pendentes (ex.: `react-hooks/set-state-in-effect` rebaixada para aviso) |
| Testes unitários (Vitest) | 🔧 | 97 testes cobrindo SLA, fluxo do chamado, permissões, travas do financeiro, formatação e validações; services e APIs ainda sem testes |
| CI (GitHub Actions) | ✅ | `.github/workflows/ci.yml`: lint, `tsc --noEmit` e testes em push/PR |

---

## Backlog Pendente (priorizado)

1. Notificações por e-mail (abertura/atualização de chamado)
2. Abertura de chamado pelo portal do cliente
3. Relatórios gerenciais em PDF
4. Exportação CSV do estoque
5. Renovação automática de contratos
6. Geração automática de cobranças de locação (cron mensal)
7. Recibo PDF de cobrança de locação
8. Vínculo UI de chamado → equipamento locado (campo `equipmentId` existe no schema, falta UI no formulário de chamados)
