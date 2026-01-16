#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set." >&2
  exit 1
fi

BACKUP_DIR=${BACKUP_DIR:-/var/backups/worldunderwater}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="${BACKUP_DIR}/worldunderwater_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Creating backup at $FILENAME"
pg_dump "$DATABASE_URL" | gzip > "$FILENAME"

echo "Backup complete."
