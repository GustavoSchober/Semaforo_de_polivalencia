#!/usr/bin/env bash
#
# Backup do Postgres — seção 14.4. Agendar no cron, diariamente.
#
# Três regras que valem mais que este script:
#   1. O destino NÃO pode ser o mesmo disco nem a mesma máquina.
#      Backup que mora junto com o dado não é backup.
#   2. Teste o restore uma vez por trimestre, num banco descartável.
#      Backup nunca testado tem alta probabilidade de não funcionar
#      exatamente quando precisar.
#   3. Antes de cada migration em produção, um dump manual. É o desfazer.
#
# Os dados deste sistema NÃO são recuperáveis por redigitação: são anos de
# avaliação de competência acumulada.

set -euo pipefail

DESTINO="${DESTINO:-/mnt/backup/semaforo}"
RETENCAO_DIAS="${RETENCAO_DIAS:-90}"
COMPOSE_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA=$(date +%F-%H%M)
ARQUIVO="$DESTINO/semaforo-$DATA.dump"

if [ ! -d "$DESTINO" ]; then
  echo "destino inexistente: $DESTINO" >&2
  exit 1
fi

cd "$COMPOSE_DIR"
docker compose exec -T postgres \
  pg_dump -U semaforo_app -Fc semaforo > "$ARQUIVO.parcial"

# só vira dump válido depois de terminar: um arquivo truncado por queda de
# energia não deve parecer um backup bom
mv "$ARQUIVO.parcial" "$ARQUIVO"

find "$DESTINO" -name 'semaforo-*.dump' -mtime "+$RETENCAO_DIAS" -delete

echo "backup em $ARQUIVO ($(du -h "$ARQUIVO" | cut -f1))"
