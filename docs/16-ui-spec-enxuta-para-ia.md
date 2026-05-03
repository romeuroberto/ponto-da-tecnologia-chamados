# UI Spec Enxuta para IA

Objetivo: fornecer instrucoes diretas para gerar uma interface profissional, simples e responsiva sem documentacao excessiva.

## Direcao visual

- estilo corporativo, limpo e moderno
- foco em produtividade
- evitar visual chamativo ou decorativo demais
- usar boa hierarquia visual e espacamento consistente

## Cores

- fundo claro
- painel principal branco ou cinza muito claro
- destaque primario em azul
- status:
  - aberto: azul
  - em atendimento: laranja
  - aguardando cliente: amarelo
  - resolvido: verde
  - encerrado: cinza
  - cancelado: vermelho
- prioridade:
  - baixa: cinza
  - media: azul
  - alta: laranja
  - critica: vermelho

## Tipografia

- sans-serif moderna
- titulos com peso 600 ou 700
- texto de interface limpo e compacto

## Layout

- desktop com sidebar fixa e area principal larga
- mobile com drawer e telas em coluna unica
- limite de largura confortavel para formularios
- espaco generoso entre secoes

## Comportamento

- a tela principal e a listagem de chamados
- filtros devem ser faceis de acessar
- acoes principais devem estar sempre visiveis
- feedback de salvar, erro e carregamento deve ser claro

## Regras de implementacao

- usar componentes reutilizaveis
- criar tabela que vira cards no mobile
- usar badges para status e prioridade
- usar modal ou drawer para filtros no mobile
- formularios sempre com labels visiveis
- incluir empty state, loading state e error state

## Componentes minimos

- `AppShell`
- `Sidebar`
- `Topbar`
- `SummaryCard`
- `DataTable`
- `TicketCard`
- `StatusBadge`
- `PriorityBadge`
- `FilterPanel`
- `FormField`
- `Toast`
- `ConfirmDialog`

## Resultado esperado

- interface com aparencia profissional
- uso confortavel em celular e desktop
- navegação simples
- leitura rapida das informacoes mais importantes
