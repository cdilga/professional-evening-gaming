#!/usr/bin/env bash
set -euo pipefail

IMAGE_TAG="${1:-latest}"
APP_DIR="$HOME/professional-evening-gaming/peg-tanker-command"

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

export TANKER_COMMAND_IMAGE_TAG="$IMAGE_TAG"
STATE_FILE="$APP_DIR/.deploy-state"

docker pull "ghcr.io/cdilga/professional-evening-gaming-tanker-command:${TANKER_COMMAND_IMAGE_TAG}"

SERVICES=(app)
if [ "${ENABLE_TUNNEL:-false}" = "true" ] && [ -n "${TUNNEL_TOKEN:-}" ]; then
  SERVICES+=(cloudflared)
fi

docker compose rm -sf app >/dev/null 2>&1 || true
docker compose up -d "${SERVICES[@]}" --remove-orphans

for _ in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${TANKER_COMMAND_PORT:-8203}/health" >/dev/null 2>&1; then
    cat > "$STATE_FILE" <<EOF
IMAGE_TAG=${TANKER_COMMAND_IMAGE_TAG}
DEPLOYED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF
    echo "PEG Tanker Command is healthy"
    exit 0
  fi
  sleep 2
done

docker compose logs --tail=80 app
exit 1
