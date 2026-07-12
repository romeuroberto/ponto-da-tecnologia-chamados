# Cadastro de computadores e acessos remotos

## Objetivo

Criar um cadastro simples para vincular computadores aos clientes e registrar os dados de acesso remoto de cada computador.

O foco do MVP é consulta rápida, poucos cliques e edição fácil durante o atendimento. Este módulo não deve virar um inventário completo de patrimônio, nem se misturar com o módulo existente de equipamentos usado para locação/empréstimo.

## Escopo do MVP

- listar computadores dentro do detalhe do cliente
- cadastrar computador vinculado ao cliente
- editar computador com facilidade
- inativar computador sem excluir definitivamente
- consultar computadores do cliente dentro do detalhe do chamado
- consultar todos os acessos em uma tela direta pelo menu `Acessos remotos`
- copiar código de acesso remoto
- revelar e copiar senha somente por ação explícita do usuário
- respeitar permissões no frontend e no backend

## Fora do MVP

- upload de anexos do computador
- histórico detalhado de alterações
- criptografia por campo ou cofre externo de senhas
- inventário técnico completo de hardware/software
- relatório geral de computadores
- associar um computador diretamente ao chamado

Esses pontos podem entrar depois, sem bloquear a entrega inicial.

## Modelo de dados

Nova entidade sugerida: `ClientComputer`.

Campos:

- `id`
- `clientId`
- `name`
- `location`
- `responsibleName`
- `remoteTool`
- `remoteCode`
- `remotePassword`
- `notes`
- `active`
- `createdAt`
- `updatedAt`

Enums para evitar texto solto demais:

- `RemoteAccessTool`
  - `ANYDESK`
  - `TEAMVIEWER`
  - `RUSTDESK`
  - `CHROME_REMOTE_DESKTOP`
  - `WINDOWS_RDP`
  - `OTHER`

No MVP, `remoteTool` é enum e `remoteCode`/`remotePassword` são strings opcionais. A senha deve continuar fora das listagens principais e aparecer apenas com botão de revelar/copiar.

## Permissões

Visualização:

- `ADMIN`: pode visualizar computadores e acessos
- `ATTENDANT`: pode visualizar computadores e acessos
- `TECHNICIAN`: pode visualizar computadores e acessos
- `CLIENT`: não acessa este módulo interno

Gerenciamento:

- `ADMIN`: pode criar, editar e inativar
- `ATTENDANT`: pode criar, editar e inativar
- `TECHNICIAN`: no MVP, somente visualiza
- `CLIENT`: sem acesso

Funções em `src/server/auth/permissions.ts`:

- `canViewClientComputers(role)`
- `canManageClientComputers(role)`

## Experiência de uso

### No detalhe do cliente

Adicionar um painel chamado `Computadores`.

Comportamento:

- mostrar lista compacta de computadores ativos
- mostrar nome, local/setor, ferramenta e código
- senha mascarada por padrão
- botões de copiar código e copiar senha
- botão `Novo computador` para `ADMIN` e `ATTENDANT`
- ação `Editar`
- ação `Inativar`

Layout esperado:

```text
Computadores

Recepção       AnyDesk     123 456 789     [Copiar] [Senha] [Editar]
Financeiro     RustDesk    987 654 321     [Copiar] [Senha] [Editar]
Servidor        RDP        srv-cliente      [Copiar] [Senha] [Editar]
```

Em telas menores, a lista pode virar cards compactos.

### No detalhe do chamado

Adicionar um painel compacto chamado `Acessos remotos do cliente`.

Comportamento:

- listar computadores ativos do cliente do chamado
- permitir copiar código/senha
- link para abrir o cliente quando for preciso gerenciar
- não permitir edição direta nessa primeira entrega

Objetivo: o técnico encontra o acesso remoto sem sair do chamado.

### Tela direta de acessos remotos

Adicionar um item de menu chamado `Acessos remotos`.

Comportamento:

- listar todos os computadores ativos dos clientes ativos
- buscar por cliente, computador, setor, ferramenta, código ou observações
- copiar código/senha diretamente na lista
- manter senha oculta até ação explícita de revelar
- abrir o cliente para edição quando necessário

Objetivo: permitir consulta operacional em um clique a partir do menu.

## APIs internas

Rotas sugeridas:

- `GET /api/clients/[id]/computers`
  - lista computadores do cliente
  - permitido para `ADMIN`, `ATTENDANT`, `TECHNICIAN`

- `POST /api/clients/[id]/computers`
  - cria computador
  - permitido para `ADMIN`, `ATTENDANT`

- `PUT /api/clients/[id]/computers/[computerId]`
  - edita computador
  - permitido para `ADMIN`, `ATTENDANT`

Na implementação do MVP, a ativação/inativação é tratada pelo próprio `PUT` via campo `active`, mantendo menos rotas.

## Camadas de código

Arquivos previstos:

- `prisma/schema.prisma`
- `prisma/migrations/.../migration.sql`
- `src/types/index.ts`
- `src/lib/validations/client-computer.ts`
- `src/server/repositories/client-computer-repository.ts`
- `src/server/services/client-computer-service.ts`
- `src/server/auth/permissions.ts`
- `src/app/api/clients/[id]/computers/route.ts`
- `src/app/api/clients/[id]/computers/[computerId]/route.ts`
- `src/components/clients/client-computers-section.tsx`
- `src/components/clients/remote-access-directory.tsx`
- `src/components/tickets/ticket-client-computers-panel.tsx`
- `src/app/(dashboard)/acessos-remotos/page.tsx`
- `src/app/(dashboard)/clientes/[id]/page.tsx`
- `src/app/(dashboard)/chamados/[id]/page.tsx`

## Validações

Regras iniciais:

- `name`: obrigatório, mínimo 2 caracteres
- `remoteTool`: obrigatório
- `remoteCode`: opcional, máximo razoável
- `remotePassword`: opcional, máximo razoável
- `location`: opcional
- `responsibleName`: opcional
- `notes`: opcional
- `active`: booleano

Normalizacoes:

- strings vazias devem virar `null`/`undefined` antes de gravar
- não criar computador para cliente inexistente
- não permitir editar computador de outro cliente

## Blocos de implementação

### Bloco 1 - Base de dados e tipos

Objetivo: criar a estrutura persistente sem mexer na interface.

Entregas:

- adicionar enum `RemoteAccessTool`
- adicionar model `ClientComputer`
- relacionar `Client.clientComputers`
- criar migration
- atualizar tipos em `src/types/index.ts`
- adicionar mapper, se necessário
- rodar `npm run prisma:generate`

Validação:

- Prisma Client gera sem erro
- migration e schema ficam consistentes

### Bloco 2 - Repository, service e permissões

Objetivo: isolar acesso a dados e regra de negócio.

Entregas:

- criar repository
- criar service
- criar schema Zod de validação
- criar permissões `canViewClientComputers` e `canManageClientComputers`
- garantir checagem de cliente existente
- garantir que computador editado pertence ao cliente

Validação:

- TypeScript sem erros
- funções pequenas e coerentes com padrão atual

### Bloco 3 - APIs internas

Objetivo: expor CRUD mínimo para a UI.

Entregas:

- `GET /api/clients/[id]/computers`
- `POST /api/clients/[id]/computers`
- `PUT /api/clients/[id]/computers/[computerId]`
- tratar inativação no `PUT` via campo `active`
- respostas padronizadas com `success`, `data` e `message`
- backend bloqueando `TECHNICIAN` para escrita

Validação:

- erros 401/403/404/400 coerentes
- não vaza cadastro entre clientes

### Bloco 4 - Painel no detalhe do cliente

Objetivo: permitir gerenciar computadores pelo caminho mais natural.

Entregas:

- componente `ClientComputersSection`
- lista compacta
- formulário simples embutido ou em área expansível
- criar, editar e inativar sem sair da página
- botão de copiar código
- botão de revelar/copiar senha
- UI bloqueando edição para quem não pode gerenciar

Validação:

- fluxo com poucos cliques
- textos em português com acentuação
- responsivo em telas menores

### Bloco 5 - Painel no detalhe do chamado

Objetivo: consulta rápida durante atendimento.

Entregas:

- componente `TicketClientComputersPanel`
- listar computadores ativos do cliente do chamado
- copiar código/senha
- link para detalhe do cliente
- sem edição direta no MVP

Validação:

- técnico acessa consulta
- painel não polui o detalhe do chamado
- estado vazio claro quando não houver computadores

### Correção de UX - Tela direta de acessos remotos

Objetivo: reduzir o caminho operacional para um clique no menu.

Entregas:

- item `Acessos remotos` no menu principal
- página `/acessos-remotos`
- busca instantânea em todos os acessos ativos
- copiar código/senha sem abrir o cliente
- link para edição no detalhe do cliente

Validação:

- operador acessa pelo menu principal
- busca e cópia funcionam sem navegar por múltiplas páginas
- permissões continuam usando `canViewClientComputers`

### Bloco 6 - Acabamento e verificação

Objetivo: garantir qualidade antes de considerar entregue.

Entregas:

- revisar estados vazios, loading e erro
- revisar permissão frontend/backend
- rodar `npm run build`
- corrigir erros de tipo/lint/build
- atualizar documentação se algo mudar na implementação

Validação:

- build limpo
- fluxo manual validado:
  - criar computador no cliente
  - editar computador
  - inativar computador
  - consultar no chamado
  - copiar código/senha

## Ordem recomendada

Implementar na sequência dos blocos acima. Cada bloco deve deixar o projeto em estado coerente antes de avançar.

O primeiro bloco a implementar deve ser `Bloco 1 - Base de dados e tipos`.
