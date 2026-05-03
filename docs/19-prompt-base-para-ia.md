# Prompt Base para IA

Use este prompt como base para gerar a primeira versao do projeto.

```text
Crie um sistema web de chamados full-stack com Next.js App Router, TypeScript, PostgreSQL, Prisma, Tailwind CSS, shadcn/ui, Auth.js com login por credenciais, React Hook Form e Zod.

Requisitos:
- interface profissional, limpa e responsiva
- mobile first sem perder usabilidade em desktop
- idioma da interface em portugues
- sistema interno para empresa de TI
- perfis: admin, atendente, tecnico

Telas do MVP:
- login
- dashboard
- listagem de chamados
- novo chamado
- detalhe do chamado com historico
- listagem de clientes
- cadastro/edicao de cliente
- listagem de usuarios
- cadastro/edicao de usuario

Regras de UI:
- sidebar fixa no desktop
- drawer no mobile
- listagem de chamados como tela principal
- tabela no desktop e cards no mobile
- badges para status e prioridade
- filtros simples e claros
- estados de loading, vazio e erro
- toasts para feedback

Regras de negocio:
- todo chamado pertence a um cliente
- status: aberto, em_atendimento, aguardando_cliente, resolvido, encerrado, cancelado
- prioridade: baixa, media, alta, critica
- registrar historico para comentarios e mudancas relevantes

Estrutura:
- usar src/app
- usar prisma/schema.prisma
- usar server/services para regra de negocio
- usar server/repositories para persistencia
- usar components reutilizaveis

Entregue:
- estrutura inicial completa
- schema Prisma
- autenticacao
- layout base
- paginas do MVP
- APIs/route handlers principais
- dados mock ou seed inicial se necessario
```
