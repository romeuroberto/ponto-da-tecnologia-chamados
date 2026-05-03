# ROADMAP

## Objetivo

Organizar as proximas entregas do Sistema de Chamados com foco em MVP operacional, qualidade tecnica e evolucao controlada.

## Estado atual

Ja implementado:

- base Next.js + TypeScript + Prisma
- autenticacao com credenciais
- sessao com perfil
- protecao de rotas e APIs
- cadastro de clientes
- cadastro de usuarios
- criacao de chamados
- historico e comentarios
- alteracao de status, prioridade e responsavel
- filtros e paginacao basicos
- autorizacao visual por perfil

## Fase 1 - Fechamento do MVP operacional

Prioridade: alta

### 1. Ordenacao nas listagens

- ordenar chamados por atualizacao, prioridade e status
- ordenar clientes por nome e volume de chamados
- ordenar usuarios por nome e perfil

### 2. Filtro por periodo em chamados

- filtrar por data de abertura
- filtrar por ultima atualizacao

### 3. Empty states e feedback melhores

- mensagens claras para lista vazia
- mensagens de nenhum resultado
- mensagens de erro por contexto

### 4. Refinar fluxo do detalhe do chamado

- melhorar visual do historico
- destacar eventos de status, prioridade e responsavel
- revisar UX de atualizacao

## Fase 2 - Persistencia e operacao real

Prioridade: alta

### 5. Upload de anexos

- suporte a envio de arquivos
- vinculo ao chamado
- exibicao no historico ou detalhe

### 6. Controle real de autor das acoes

- usar usuario autenticado nas mudancas
- remover dependencia de "primeiro usuario ativo" como autor tecnico

### 7. Endurecimento da autorizacao

- revisar permissoes por API
- garantir coerencia entre UI e backend
- revisar acesso a dados por perfil

## Fase 3 - Qualidade e administracao

Prioridade: media

### 8. Auditoria mais detalhada

- registrar campos alterados
- registrar login e logout
- registrar acoes administrativas

### 9. Seeds e dados de desenvolvimento melhores

- cenarios com mais usuarios
- mais clientes e chamados
- dados para testes visuais e funcionais

### 10. Padronizacao de validacoes

- mensagens consistentes
- mapear erros de API para UI
- revisar inputs obrigatorios e opcionais

## Fase 4 - Experiencia do usuario

Prioridade: media

### 11. Dashboard mais util

- cards com mais contexto
- chamados criticos
- chamados sem responsavel
- chamados aguardando cliente

### 12. Busca e filtros melhores

- filtros persistentes
- combinacoes mais amigaveis
- UX melhor em mobile

### 13. Performance de listagens

- paginação mais refinada
- queries mais enxutas
- indices no banco conforme volume real

## Fase 5 - Seguranca e maturidade

Prioridade: media

### 14. Recuperacao e troca de senha

- redefinicao de senha
- troca de senha autenticada

### 15. Hardening de autenticação

- revisar expiração de sessão
- reforçar segredo de produção
- revisar tratamento de erro no login

### 16. Testes

- testes de auth
- testes de permissoes
- testes de regras do chamado
- testes de APIs principais

## Fase 6 - Evolucoes futuras

Prioridade: baixa

### 17. SLA

- prazo por prioridade
- alertas por atraso

### 18. Portal do cliente

- abertura externa de chamados
- acompanhamento pelo cliente

### 19. Notificacoes

- e-mail
- avisos internos

### 20. Relatorios e exportacoes

- exportacao de chamados
- indicadores por cliente
- indicadores por tecnico

### 21. Financeiro simples por chamado

- resumo financeiro vinculado ao chamado
- lancamentos de horas, pecas, deslocamento e extras
- status financeiro independente do status tecnico
- relatorios de faturamento pendente e total por periodo

## Ordem recomendada de execucao

1. ordenacao nas listagens
2. filtro por periodo
3. melhoria de empty states e feedback
4. controle real de autor autenticado
5. upload de anexos
6. dashboard mais util
7. testes principais

## Regras de priorizacao

- primeiro o que afeta operacao diaria
- depois o que reduz risco tecnico
- depois o que melhora experiencia
- por ultimo, integracoes e recursos avancados

## Definicao de pronto por etapa

Uma etapa so deve ser considerada pronta quando:

- build passar
- permissao estiver coerente na UI e API
- fluxo principal funcionar de ponta a ponta
- documentacao curta for atualizada quando necessario
