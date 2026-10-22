#!/usr/bin/env bash
# Backup da pasta de avatares (apps/api/uploads). Ela não vai para o Git, então só existe na VPS.
#
# Uso manual:   bash scripts/backup-uploads.sh
# Todo dia:     adicione em `crontab -e` (usuário deploy):
#   30 4 * * * bash /home/deploy/projetos/anihype/scripts/backup-uploads.sh >> /home/deploy/backups/backup.log 2>&1
#
# Variáveis opcionais:
#   UPLOADS_DIR   pasta de origem   (padrão: apps/api/uploads, ou AVATAR_UPLOAD_DIR do .env da API)
#   BACKUP_DIR    pasta dos backups (padrão: /home/deploy/backups/uploads)
#   KEEP          quantos backups manter (padrão: 14)
#   BACKUP_REMOTE destino extra para rsync, ex.: usuario@outro-servidor:/backups/anihype
#                 Sem isso, o backup fica só nesta VPS. Copie para fora de vez em quando.
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-/home/deploy/projetos/anihype}"
API_ENV="$ROOT_DIR/apps/api/.env"

if [ -z "${UPLOADS_DIR:-}" ] && [ -f "$API_ENV" ]; then
  UPLOADS_DIR="$(grep -E '^AVATAR_UPLOAD_DIR=' "$API_ENV" | tail -n 1 | cut -d= -f2- | tr -d '"' | tr -d "'" || true)"
fi

UPLOADS_DIR="${UPLOADS_DIR:-$ROOT_DIR/apps/api/uploads}"
BACKUP_DIR="${BACKUP_DIR:-/home/deploy/backups/uploads}"
KEEP="${KEEP:-14}"

timestamp="$(date +%Y%m%d-%H%M%S)"
archive="$BACKUP_DIR/anihype-uploads-$timestamp.tar.gz"

echo "[$(date '+%F %T')] Backup de avatares"

if [ ! -d "$UPLOADS_DIR" ]; then
  echo "Pasta $UPLOADS_DIR não existe ainda. Nada para salvar."
  exit 0
fi

mkdir -p "$BACKUP_DIR"

# Escreve num arquivo temporário e só renomeia no fim, para nunca sobrar backup pela metade.
tmp="$archive.partial"
tar -czf "$tmp" -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")"
mv "$tmp" "$archive"

size="$(du -h "$archive" | cut -f1)"
files="$(find "$UPLOADS_DIR" -type f | wc -l)"
echo "OK: $archive ($size, $files arquivos)"

# Mantém só os KEEP backups mais recentes.
ls -1t "$BACKUP_DIR"/anihype-uploads-*.tar.gz 2>/dev/null | tail -n +"$((KEEP + 1))" | xargs -r rm --
echo "Backups guardados: $(ls -1 "$BACKUP_DIR"/anihype-uploads-*.tar.gz | wc -l) (limite $KEEP)"

if [ -n "${BACKUP_REMOTE:-}" ]; then
  rsync -a --delete-after "$BACKUP_DIR/" "$BACKUP_REMOTE/"
  echo "Cópia enviada para $BACKUP_REMOTE"
fi
