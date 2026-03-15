#!/usr/bin/env bash
set -euo pipefail

IMAGE_TAG="${1:-latest}"
APP_DIR="$HOME/professional-evening-gaming/peg-nightly-landing"

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
fi

export PEG_NIGHTLY_IMAGE_TAG="$IMAGE_TAG"

docker pull "ghcr.io/cdilga/professional-evening-gaming-nightly-landing:${PEG_NIGHTLY_IMAGE_TAG}"
docker compose up -d app cloudflared --remove-orphans

for _ in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${LANDING_PORT:-8200}/" >/dev/null 2>&1; then
    echo "PEG Nightly Landing is healthy"
    exit 0
  fi
  sleep 2
done

docker compose logs --tail=80 app
exit 1
