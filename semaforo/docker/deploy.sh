#!/usr/bin/env bash
#
# Publicar versão nova — seção 14.5.
#
# Não existe para automatizar: existe para não esquecer a ordem às onze da
# noite.

set -euo pipefail
COMPOSE_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$COMPOSE_DIR"

echo "1/4  dump manual antes da migration (o botão de desfazer)"
./backup.sh

echo "2/4  build da imagem"
docker compose build app

echo "3/4  migrations"
docker compose run --rm app npx drizzle-kit migrate

echo "4/4  subindo a aplicação"
docker compose up -d app

docker compose ps
