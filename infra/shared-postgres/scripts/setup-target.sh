#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$HOME/professional-evening-gaming/shared-postgres"

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
  echo "Created $APP_DIR/.env - fill real Postgres credentials before deploys."
fi
