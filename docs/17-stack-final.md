# Stack Final

Objetivo: usar uma stack simples, moderna e economica em complexidade para implementacao por IA.

## Escolha principal

- app unica full-stack
- Next.js com App Router
- TypeScript
- PostgreSQL
- Prisma
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- Auth.js com credenciais

## Motivo da escolha

- uma base unica reduz contexto e tokens
- frontend e backend no mesmo projeto
- stack amplamente conhecida por IA
- componentes prontos aceleram interface profissional
- Prisma simplifica banco e CRUD
- Zod e React Hook Form simplificam validacao

## Escopo tecnico inicial

- interface web responsiva
- rotas protegidas
- CRUD de clientes
- CRUD de chamados
- historico de interacoes
- dashboard simples
- usuarios internos com perfil

## Perfis de acesso

- admin
- atendente
- tecnico

## Decisoes tecnicas

- usar `src/` no projeto
- usar Server Components por padrao
- usar Client Components apenas quando necessario
- usar Route Handlers para API interna
- usar Prisma para toda persistencia
- usar upload local no desenvolvimento e abstrair para nuvem depois

## Ambiente de banco

- o PostgreSQL do projeto nao roda como instancia local nativa
- o banco roda em container no Docker Desktop
- comandos de migration, seed e validacao de banco devem assumir esse ambiente containerizado
- nao presumir que o banco esteja disponivel fora do Docker apenas por existir `DATABASE_URL`

## Bibliotecas recomendadas

- `next`
- `react`
- `typescript`
- `tailwindcss`
- `shadcn/ui`
- `lucide-react`
- `@prisma/client`
- `prisma`
- `zod`
- `react-hook-form`
- `@hookform/resolvers`
- `next-auth`
- `bcryptjs`
- `date-fns`

## Itens que ficam fora por enquanto

- microservicos
- app mobile nativo
- websocket
- mensageria
- integracoes externas
- arquitetura separada frontend/backend
