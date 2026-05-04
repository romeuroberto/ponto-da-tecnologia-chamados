#!/bin/bash
set -e

echo "════════════════════════════════════════"
echo "  Deploy — Ponto da Tecnologia Chamados"
echo "════════════════════════════════════════"

# Garante que o .env existe
if [ ! -f .env.production ]; then
  echo "❌ Arquivo .env.production não encontrado."
  echo "   Copie .env.production.example e preencha os valores."
  exit 1
fi

# Carrega variáveis de ambiente
export $(grep -v '^#' .env.production | xargs)

# Pull do código mais recente
echo "▶ Atualizando código..."
git pull origin main

# Build e restart
echo "▶ Construindo imagem e reiniciando serviços..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

echo ""
echo "✅ Deploy concluído!"
docker compose -f docker-compose.prod.yml ps
