#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$HOME/professional-evening-gaming/astacus-bot"

echo "=== PEG Astacus Bot target setup ==="

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed for this user. Provision Docker access on the host first." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose plugin is missing for this user. Provision it on the host first." >&2
  exit 1
fi

mkdir -p "$APP_DIR"

if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  echo "Created $APP_DIR/.env from .env.example - fill real values before deploys."
fi

echo "Next steps:"
echo "1. Edit $APP_DIR/.env"
echo "2. Add TUNNEL_TOKEN and database secrets"
echo "3. Add GHCR credentials if the image stays private"
