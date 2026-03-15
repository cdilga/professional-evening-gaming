#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$HOME/professional-evening-gaming/shared-postgres"
STATE_FILE="$APP_DIR/.deploy-state"

cd "$APP_DIR"

if [ ! -f .env ]; then
  echo "Missing $APP_DIR/.env - run setup-target.sh first." >&2
  exit 1
fi

set -a
. ./.env
set +a

docker compose up -d --remove-orphans

for _ in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-peg_admin}" -d "${POSTGRES_DB:-peg}" >/dev/null 2>&1; then
    cat > "$STATE_FILE" <<EOF
DEPLOYED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
POSTGRES_DB=${POSTGRES_DB:-peg}
POSTGRES_USER=${POSTGRES_USER:-peg_admin}
EOF
    echo "Shared Postgres is healthy"
    exit 0
  fi
  sleep 2
done

docker compose logs --tail=80 postgres
exit 1
