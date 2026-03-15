#!/usr/bin/env bash
set -euo pipefail

IMAGE_TAG="${1:-latest}"
APP_DIR="$HOME/professional-evening-gaming/peg-session-hub"

cd "$APP_DIR"

if [ ! -f .env ]; then
  echo "Missing $APP_DIR/.env - run setup-target.sh first." >&2
  exit 1
fi

set -a
. ./.env
set +a

if [ -n "${GHCR_USERNAME:-}" ] && [ -n "${GHCR_TOKEN:-}" ]; then
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin
else
  docker logout ghcr.io >/dev/null 2>&1 || true
fi

export SESSION_HUB_IMAGE_TAG="$IMAGE_TAG"
STATE_FILE="$APP_DIR/.deploy-state"

COMPOSE_ARGS=(docker compose -f docker-compose.yml)
if [ "${USE_SHARED_POSTGRES:-false}" = "true" ]; then
  COMPOSE_ARGS+=( -f docker-compose.shared-db.yml )
fi

docker pull "ghcr.io/cdilga/professional-evening-gaming-session-hub:${SESSION_HUB_IMAGE_TAG}"
if [ "${USE_SHARED_POSTGRES:-false}" != "true" ]; then
  "${COMPOSE_ARGS[@]}" up -d postgres

  for _ in $(seq 1 30); do
    if "${COMPOSE_ARGS[@]}" exec -T postgres pg_isready -U "${POSTGRES_USER:-session_hub}" -d "${POSTGRES_DB:-peg}" >/dev/null 2>&1; then
      break
    fi
    sleep 2
  done
fi

"${COMPOSE_ARGS[@]}" run --rm api python -m app.migrate
"${COMPOSE_ARGS[@]}" rm -sf api >/dev/null 2>&1 || true
"${COMPOSE_ARGS[@]}" up -d api cloudflared --remove-orphans

for _ in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${SESSION_HUB_PORT:-8201}/health" >/dev/null 2>&1; then
    cat > "$STATE_FILE" <<EOF
IMAGE_TAG=${SESSION_HUB_IMAGE_TAG}
DEPLOYED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
USE_SHARED_POSTGRES=${USE_SHARED_POSTGRES:-false}
EOF
    echo "PEG Session Hub is healthy"
    exit 0
  fi
  sleep 2
done

"${COMPOSE_ARGS[@]}" logs --tail=80 api
exit 1
