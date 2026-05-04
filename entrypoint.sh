#!/bin/sh
set -e

echo "▶ Aplicando migrações do banco de dados..."
node ./node_modules/prisma/build/index.js migrate deploy

echo "▶ Iniciando aplicação..."
exec node server.js
