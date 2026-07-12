# Cadastro de computadores e acessos remotos

## Objetivo

Criar um cadastro simples para vincular computadores aos clientes e registrar os dados de acesso remoto de cada computador.

O foco do MVP e consulta rapida, poucos cliques e edicao facil durante o atendimento. Este modulo nao deve virar um inventario completo de patrimonio, nem se misturar com o modulo existente de equipamentos usado para locacao/emprestimo.

## Escopo do MVP

- listar computadores dentro do detalhe do cliente
- cadastrar computador vinculado ao cliente
- editar computador com facilidade
- inativar computador sem excluir definitivamente
- consultar computadores do cliente dentro do detalhe do chamado
- copiar codigo de acesso remoto
- revelar e copiar senha somente por acao explicita do usuario
- respeitar permissoes no frontend e no backend

## Fora do MVP

- upload de anexos do computador
- historico detalhado de alteracoes
- criptografia por campo ou cofre externo de senhas
- inventario tecnico completo de hardware/software
- relatorio geral de computadores
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

Enums opcionais para evitar texto solto demais:

- `RemoteAccessTool`
  - `ANYDESK`
  - `TEAMVIEWER`
  - `RUSTDESK`
  - `CHROME_REMOTE_DESKTOP`
  - `WINDOWS_RDP`
  - `OTHER`

No MVP, `remoteTool` pode ser enum e `remoteCode`/`remotePassword` podem ser strings opcionais. A senha deve continuar fora das listagens principais e aparecer apenas com botao de revelar/copiar.

## Permissoes

Visualizacao:

- `ADMIN`: pode visualizar computadores e acessos
- `ATTENDANT`: pode visualizar computadores e acessos
- `TECHNICIAN`: pode visualizar computadores e acessos
- `CLIENT`: nao acessa este modulo interno

Gerenciamento:

- `ADMIN`: pode criar, editar e inativar
- `ATTENDANT`: pode criar, editar e inativar
- `TECHNICIAN`: no MVP, somente visualiza
- `CLIENT`: sem acesso

Funcoes sugeridas em `src/server/auth/permissions.ts`:

- `canViewClientComputers(role)`
- `canManageClientComputers(role)`

## Experiencia de uso

### No detalhe do cliente

Adicionar um painel chamado `Computadores`.

Comportamento:

- mostrar lista compacta de computadores ativos
- mostrar nome, local/setor, ferramenta e codigo
- senha mascarada por padrao
- botoes de copiar codigo e copiar senha
- botao `Novo computador` para `ADMIN` e `ATTENDANT`
- acao `Editar`
- acao `Inativar`

Layout esperado:

```text
Computadores

Recepcao       AnyDesk     123 456 789     [Copiar] [Senha] [Editar]
Financeiro     RustDesk    987 654 321     [Copiar] [Senha] [Editar]
Servidor        RDP        srv-cliente      [Copiar] [Senha] [Editar]
```

Em telas menores, a lista pode virar cards compactos.

### No detalhe do chamado

Adicionar um painel compacto chamado `Acessos remotos do cliente`.

Comportamento:

- listar computadores ativos do cliente do chamado
- permitir copiar codigo/senha
- link para abrir o cliente quando for preciso gerenciar
- nao permitir edicao direta nessa primeira entrega

Objetivo: o tecnico encontra o acesso remoto sem sair do chamado.

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

- `PATCH /api/clients/[id]/computers/[computerId]/status`
  - ativa/inativa computador
  - permitido para `ADMIN`, `ATTENDANT`

Opcionalmente, a inativacao pode ser tratada pelo proprio `PUT` para manter menos rotas no MVP.

## Camadas de codigo

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
- `src/components/tickets/ticket-client-computers-panel.tsx`
- `src/app/(dashboard)/clientes/[id]/page.tsx`
- `src/app/(dashboard)/chamados/[id]/page.tsx`

## Validacoes

Regras iniciais:

- `name`: obrigatorio, minimo 2 caracteres
- `remoteTool`: obrigatorio
- `remoteCode`: opcional, maximo razoavel
- `remotePassword`: opcional, maximo razoavel
- `location`: opcional
- `responsibleName`: opcional
- `notes`: opcional
- `active`: booleano

Normalizacoes:

- strings vazias devem virar `null`/`undefined` antes de gravar
- nao criar computador para cliente inexistente
- nao permitir editar computador de outro cliente

## Blocos de implementacao

### Bloco 1 - Base de dados e tipos

Objetivo: criar a estrutura persistente sem mexer na interface.

Entregas:

- adicionar enum `RemoteAccessTool`
- adicionar model `ClientComputer`
- relacionar `Client.clientComputers`
- criar migration
- atualizar tipos em `src/types/index.ts`
- adicionar mapper, se necessario
- rodar `npm run prisma:generate`

Validacao:

- Prisma Client gera sem erro
- migration e schema ficam consistentes

### Bloco 2 - Repository, service e permissoes

Objetivo: isolar acesso a dados e regra de negocio.

Entregas:

- criar repository
- criar service
- criar schema Zod de validacao
- criar permissoes `canViewClientComputers` e `canManageClientComputers`
- garantir checagem de cliente existente
- garantir que computador editado pertence ao cliente

Validacao:

- TypeScript sem erros
- funcoes pequenas e coerentes com padrao atual

### Bloco 3 - APIs internas

Objetivo: expor CRUD minimo para a UI.

Entregas:

- `GET /api/clients/[id]/computers`
- `POST /api/clients/[id]/computers`
- `PUT /api/clients/[id]/computers/[computerId]`
- tratar inativacao no `PUT` via campo `active`
- respostas padronizadas com `success`, `data` e `message`
- backend bloqueando `TECHNICIAN` para escrita

Validacao:

- erros 401/403/404/400 coerentes
- nao vaza cadastro entre clientes

### Bloco 4 - Painel no detalhe do cliente

Objetivo: permitir gerenciar computadores pelo caminho mais natural.

Entregas:

- componente `ClientComputersSection`
- lista compacta
- formulario simples embutido ou em area expansivel
- criar, editar e inativar sem sair da pagina
- botao de copiar codigo
- botao de revelar/copiar senha
- UI bloqueando edicao para quem nao pode gerenciar

Validacao:

- fluxo com poucos cliques
- textos em portugues com acentuacao
- responsivo em telas menores

### Bloco 5 - Painel no detalhe do chamado

Objetivo: consulta rapida durante atendimento.

Entregas:

- componente `TicketClientComputersPanel`
- listar computadores ativos do cliente do chamado
- copiar codigo/senha
- link para detalhe do cliente
- sem edicao direta no MVP

Validacao:

- tecnico acessa consulta
- painel nao polui o detalhe do chamado
- estado vazio claro quando nao houver computadores

### Bloco 6 - Acabamento e verificacao

Objetivo: garantir qualidade antes de considerar entregue.

Entregas:

- revisar estados vazios, loading e erro
- revisar permissao frontend/backend
- rodar `npm run build`
- corrigir erros de tipo/lint/build
- atualizar documentacao se algo mudar na implementacao

Validacao:

- build limpo
- fluxo manual validado:
  - criar computador no cliente
  - editar computador
  - inativar computador
  - consultar no chamado
  - copiar codigo/senha

## Ordem recomendada

Implementar na sequencia dos blocos acima. Cada bloco deve deixar o projeto em estado coerente antes de avançar.

O primeiro bloco a implementar deve ser `Bloco 1 - Base de dados e tipos`.
