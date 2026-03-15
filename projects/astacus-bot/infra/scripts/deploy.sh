#!/usr/bin/env bash
set -euo pipefail

IMAGE_TAG="${1:-latest}"
APP_DIR="$HOME/professional-evening-gaming/astacus-bot"

mkdir -p "$APP_DIR"
cd "$APP_DIR"

if [ ! -f .env ]; then
  echo "Missing $APP_DIR/.env - copy infra/.env.example and set real values first." >&2
  exit 1
fi

set -a
. ./.env
set +a

export ASTACUS_IMAGE_TAG="$IMAGE_TAG"
STATE_FILE="$APP_DIR/.deploy-state"

COMPOSE_ARGS=(docker compose -f docker-compose.yml)
if [ "${USE_SHARED_POSTGRES:-false}" = "true" ]; then
  COMPOSE_ARGS+=( -f docker-compose.shared-db.yml )
fi

if [ -n "${GHCR_USERNAME:-}" ] && [ -n "${GHCR_TOKEN:-}" ]; then
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin
fi

echo "Pulling ghcr.io/cdilga/professional-evening-gaming-astacus-api:${ASTACUS_IMAGE_TAG}"
docker pull "ghcr.io/cdilga/professional-evening-gaming-astacus-api:${ASTACUS_IMAGE_TAG}"

if [ "${USE_SHARED_POSTGRES:-false}" != "true" ]; then
  echo "Starting postgres"
  "${COMPOSE_ARGS[@]}" up -d postgres

  for _ in $(seq 1 30); do
    if "${COMPOSE_ARGS[@]}" exec -T postgres pg_isready -U "${POSTGRES_USER:-astacus}" -d "${POSTGRES_DB:-peg}" >/dev/null 2>&1; then
      break
    fi
    sleep 2
  done
fi

echo "Running migrations"
"${COMPOSE_ARGS[@]}" run --rm api python -m app.migrate

SERVICES=(api)
if [ "${ENABLE_TUNNEL:-false}" = "true" ] && [ -n "${TUNNEL_TOKEN:-}" ]; then
  SERVICES+=(cloudflared)
fi

"${COMPOSE_ARGS[@]}" rm -sf api >/dev/null 2>&1 || true

echo "Restarting ${SERVICES[*]}"
"${COMPOSE_ARGS[@]}" up -d "${SERVICES[@]}" --remove-orphans

echo "Waiting for health check"
for _ in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${API_PORT:-8100}/health" >/dev/null 2>&1; then
    cat > "$STATE_FILE" <<EOF
IMAGE_TAG=${ASTACUS_IMAGE_TAG}
DEPLOYED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
USE_SHARED_POSTGRES=${USE_SHARED_POSTGRES:-false}
EOF
    echo "Astacus API is healthy"
    exit 0
  fi
  sleep 2
done

echo "Health check failed"
"${COMPOSE_ARGS[@]}" logs --tail=80 api
exit 1
