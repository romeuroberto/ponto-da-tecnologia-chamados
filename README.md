# Central de Chamados — Ponto da Tecnologia

Sistema web interno para registro, acompanhamento e encerramento de chamados de suporte técnico, com módulo financeiro, vendas, controle de estoque e portal do cliente.

**Stack:** Next.js 15 · TypeScript · Prisma · PostgreSQL · Auth.js · Tailwind CSS · Docker

---

## Deploy em produção (Proxmox + Ubuntu 24.04)

### Pré-requisitos

- Container LXC Ubuntu 24.04 no Proxmox
- Disco de storage separado montado no LXC (ex: `/mnt/storage`)
- Nginx Proxy Manager rodando em outro container com acesso à rede
- Domínio configurado apontando para o IP público do servidor
- Repositório clonado no servidor

---

### 1. Instalar Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

---

### 2. Clonar o repositório

```bash
git clone <url-do-repositorio> /opt/chamados
cd /opt/chamados
```

---

### 3. Preparar o disco de storage

O banco de dados e os arquivos enviados são armazenados fora do container, no disco de storage.

```bash
# Criar estrutura de diretórios
mkdir -p /mnt/storage/chamados/postgres
mkdir -p /mnt/storage/chamados/uploads

# Permissões: postgres roda como uid 999, app como uid 1001
chown -R 999:999  /mnt/storage/chamados/postgres
chown -R 1001:1001 /mnt/storage/chamados/uploads
```

---

### 4. Criar o arquivo de variáveis de ambiente

```bash
cp .env.production.example .env.production
nano .env.production
```

Preencher o arquivo:

```env
# Banco de dados
POSTGRES_DB=ticket_system
POSTGRES_USER=postgres
POSTGRES_PASSWORD=senha_forte_aqui

# Aplicação
AUTH_SECRET=   # gerar com: openssl rand -base64 32
AUTH_URL=https://chamados.seudominio.com.br

# Caminho do disco de storage no host
STORAGE_PATH=/mnt/storage/chamados
```

Gerar o `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

---

### 5. Primeiro deploy

```bash
chmod +x deploy.sh
./deploy.sh
```

O script irá:
1. Fazer `git pull` do código mais recente
2. Construir a imagem Docker (instala dependências, gera Prisma client, build Next.js)
3. Subir os containers de banco e aplicação
4. Executar automaticamente as migrações do banco ao iniciar

O primeiro build leva alguns minutos. Acompanhe os logs:

```bash
docker compose -f docker-compose.prod.yml logs -f app
```

---

### 6. Criar o usuário administrador inicial

Após os containers estarem rodando, execute o seed para criar o usuário admin padrão:

```bash
docker compose -f docker-compose.prod.yml exec app node prisma/seed.js
```

> As credenciais iniciais estão definidas no arquivo `prisma/seed.js`. Altere a senha após o primeiro acesso.

---

### 7. Configurar o Nginx Proxy Manager

No painel do Nginx Proxy Manager, adicionar um novo **Proxy Host**:

| Campo | Valor |
|---|---|
| Domain Names | `chamados.seudominio.com.br` |
| Scheme | `http` |
| Forward Hostname / IP | IP do LXC Ubuntu no Proxmox |
| Forward Port | `3000` |
| Websockets Support | Ativado |

Na aba **SSL**:
- Selecionar **Request a new SSL Certificate**
- Ativar **Force SSL**
- Ativar **HTTP/2 Support**

---

### 8. Atualizações futuras

Para atualizar a aplicação após novos commits no repositório:

```bash
cd /opt/chamados
./deploy.sh
```

O script puxa o código novo, rebuilda a imagem e reinicia os serviços. As migrações de banco são aplicadas automaticamente no startup.

---

## Desenvolvimento local

### Pré-requisitos

- Node.js 20+
- Docker (para o banco de dados)

### Configuração

```bash
# Instalar dependências
npm install

# Subir o banco de dados local
docker compose up -d

# Copiar e preencher as variáveis de ambiente
cp .env.example .env
# Editar .env com as credenciais locais

# Aplicar migrações e seed
npx prisma migrate deploy
node prisma/seed.js

# Iniciar o servidor de desenvolvimento
npm run dev
```

Acesse em [http://localhost:3000](http://localhost:3000).

### Comandos úteis

```bash
# Regenerar o Prisma client após mudanças no schema
# (parar o servidor antes no Windows)
npx prisma generate

# Criar nova migração
npx prisma migrate dev --name descricao_da_mudanca

# Abrir o Prisma Studio (interface visual do banco)
npx prisma studio
```

---

## Estrutura de diretórios relevante

```
├── prisma/
│   ├── schema.prisma       # Modelo de dados
│   ├── migrations/         # Histórico de migrações SQL
│   └── seed.js             # Dados iniciais (usuário admin)
├── src/
│   ├── app/                # Rotas Next.js (App Router)
│   │   ├── (dashboard)/    # Área interna (admin/atendente/técnico)
│   │   ├── portal/         # Portal do cliente
│   │   └── api/            # API Routes
│   ├── components/         # Componentes React
│   ├── server/             # Repositórios, serviços, autenticação
│   └── types/              # Tipos TypeScript globais
├── Dockerfile
├── docker-compose.prod.yml # Compose de produção
├── docker-compose.yml      # Compose local (apenas banco)
├── deploy.sh               # Script de atualização
└── .env.production.example # Template de variáveis de produção
```

---

## Perfis de acesso

| Perfil | Acesso |
|---|---|
| `ADMIN` | Acesso total ao sistema |
| `ATTENDANT` | Chamados, financeiro, clientes, vendas |
| `TECHNICIAN` | Chamados e ordens de serviço |
| `CLIENT` | Portal do cliente (`/portal`) |
