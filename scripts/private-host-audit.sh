#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-}"
SSH_CONFIG_FILE="${SSH_CONFIG_FILE:-$HOME/.ssh/config}"
SSH_TARGET="${SSH_TARGET:-deploy-target}"

if [ -z "$MODE" ]; then
  echo "Usage: $0 <drift|health>" >&2
  exit 1
fi

declare -A DEPLOY_DIR=(
  [shared-postgres]="professional-evening-gaming/shared-postgres"
  [astacus-bot]="professional-evening-gaming/astacus-bot"
  [peg-nightly-landing]="professional-evening-gaming/peg-nightly-landing"
  [peg-session-hub]="professional-evening-gaming/peg-session-hub"
  [peg-live-lobby]="professional-evening-gaming/peg-live-lobby"
  [peg-tanker-command]="professional-evening-gaming/peg-tanker-command"
)

declare -A CONTAINER_NAME=(
  [shared-postgres]="peg-shared-postgres"
  [astacus-bot]="peg-astacus-api"
  [peg-nightly-landing]="peg-nightly-landing"
  [peg-session-hub]="peg-session-hub-api"
  [peg-live-lobby]="peg-live-lobby"
  [peg-tanker-command]="peg-tanker-command"
)

remote_exists() {
  local path="$1"
  ssh -F "$SSH_CONFIG_FILE" "$SSH_TARGET" "test -e \"\$HOME/$path\""
}

remote_read_state() {
  local dir="$1"
  ssh -F "$SSH_CONFIG_FILE" "$SSH_TARGET" "if [ -f \"\$HOME/$dir/.deploy-state\" ]; then . \"\$HOME/$dir/.deploy-state\"; env | grep -E '^(IMAGE_TAG|DEPLOYED_AT|USE_SHARED_POSTGRES|POSTGRES_DB|POSTGRES_USER)='; fi"
}

compare_file() {
  local local_path="$1"
  local remote_path="$2"
  local local_hash remote_hash

  local_hash="$(sha256sum "$local_path" | cut -d' ' -f1)"
  remote_hash="$(ssh -F "$SSH_CONFIG_FILE" "$SSH_TARGET" "sha256sum \"\$HOME/$remote_path\" | cut -d' ' -f1")"

  if [ "$local_hash" != "$remote_hash" ]; then
    echo "drift: $remote_path hash differs from repo copy" >&2
    return 1
  fi
}

check_drift() {
  local service="$1"
  local dir="${DEPLOY_DIR[$service]}"
  local failed=0

  if ! remote_exists "$dir"; then
    echo "skip: $service not bootstrapped on host"
    return 0
  fi

  if ! remote_exists "$dir/.env"; then
    echo "drift: $service missing $HOME/$dir/.env" >&2
    failed=1
  fi

  case "$service" in
    shared-postgres)
        compare_file "infra/shared-postgres/docker-compose.yml" "$dir/docker-compose.yml" || failed=1
      compare_file "infra/shared-postgres/.env.example" "$dir/.env.example" || failed=1
      compare_file "infra/shared-postgres/scripts/setup-target.sh" "$dir/setup-target.sh" || failed=1
      compare_file "infra/shared-postgres/scripts/deploy.sh" "$dir/deploy.sh" || failed=1
      ;;
    astacus-bot)
      compare_file "projects/astacus-bot/infra/docker-compose.yml" "$dir/docker-compose.yml" || failed=1
      if remote_exists "$dir/docker-compose.shared-db.yml"; then
        compare_file "projects/astacus-bot/infra/docker-compose.shared-db.yml" "$dir/docker-compose.shared-db.yml" || failed=1
      fi
      compare_file "projects/astacus-bot/infra/.env.example" "$dir/.env.example" || failed=1
      compare_file "projects/astacus-bot/infra/scripts/setup-target.sh" "$dir/setup-target.sh" || failed=1
      compare_file "projects/astacus-bot/infra/scripts/deploy.sh" "$dir/deploy.sh" || failed=1
      ;;
    peg-nightly-landing)
      compare_file "projects/peg-nightly-landing/infra/docker-compose.yml" "$dir/docker-compose.yml" || failed=1
      compare_file "projects/peg-nightly-landing/infra/.env.example" "$dir/.env.example" || failed=1
      compare_file "projects/peg-nightly-landing/infra/scripts/setup-target.sh" "$dir/setup-target.sh" || failed=1
      compare_file "projects/peg-nightly-landing/infra/scripts/deploy.sh" "$dir/deploy.sh" || failed=1
      ;;
    peg-session-hub)
      compare_file "projects/peg-session-hub/infra/docker-compose.yml" "$dir/docker-compose.yml" || failed=1
      if remote_exists "$dir/docker-compose.shared-db.yml"; then
        compare_file "projects/peg-session-hub/infra/docker-compose.shared-db.yml" "$dir/docker-compose.shared-db.yml" || failed=1
      fi
      compare_file "projects/peg-session-hub/infra/.env.example" "$dir/.env.example" || failed=1
      compare_file "projects/peg-session-hub/infra/scripts/setup-target.sh" "$dir/setup-target.sh" || failed=1
      compare_file "projects/peg-session-hub/infra/scripts/deploy.sh" "$dir/deploy.sh" || failed=1
      ;;
    peg-live-lobby)
      compare_file "projects/peg-live-lobby/infra/docker-compose.yml" "$dir/docker-compose.yml" || failed=1
      compare_file "projects/peg-live-lobby/infra/.env.example" "$dir/.env.example" || failed=1
      compare_file "projects/peg-live-lobby/infra/scripts/setup-target.sh" "$dir/setup-target.sh" || failed=1
      compare_file "projects/peg-live-lobby/infra/scripts/deploy.sh" "$dir/deploy.sh" || failed=1
      ;;
    peg-tanker-command)
      compare_file "projects/peg-tanker-command/infra/docker-compose.yml" "$dir/docker-compose.yml" || failed=1
      compare_file "projects/peg-tanker-command/infra/.env.example" "$dir/.env.example" || failed=1
      compare_file "projects/peg-tanker-command/infra/scripts/setup-target.sh" "$dir/setup-target.sh" || failed=1
      compare_file "projects/peg-tanker-command/infra/scripts/deploy.sh" "$dir/deploy.sh" || failed=1
      ;;
  esac

  if remote_exists "$dir/.deploy-state"; then
    local state image_tag expected_image actual_image container
    state="$(remote_read_state "$dir")"
    image_tag="$(printf '%s\n' "$state" | grep '^IMAGE_TAG=' | cut -d= -f2- || true)"
    container="${CONTAINER_NAME[$service]}"
    if [ -n "$image_tag" ] && [ "$service" != "shared-postgres" ]; then
      case "$service" in
        astacus-bot) expected_image="ghcr.io/cdilga/professional-evening-gaming-astacus-api:$image_tag" ;;
        peg-nightly-landing) expected_image="ghcr.io/cdilga/professional-evening-gaming-nightly-landing:$image_tag" ;;
        peg-session-hub) expected_image="ghcr.io/cdilga/professional-evening-gaming-session-hub:$image_tag" ;;
        peg-live-lobby) expected_image="ghcr.io/cdilga/professional-evening-gaming-live-lobby:$image_tag" ;;
        peg-tanker-command) expected_image="ghcr.io/cdilga/professional-evening-gaming-tanker-command:$image_tag" ;;
      esac
      actual_image="$(ssh -F "$SSH_CONFIG_FILE" "$SSH_TARGET" "docker inspect --format='{{.Config.Image}}' '$container' 2>/dev/null || true")"
      if [ "$actual_image" != "$expected_image" ]; then
        echo "drift: $service container image '$actual_image' does not match recorded '$expected_image'" >&2
        failed=1
      fi
    fi
  fi

  return "$failed"
}

check_health() {
  local service="$1"
  local dir="${DEPLOY_DIR[$service]}"

  if ! remote_exists "$dir/.env"; then
    echo "skip: $service missing runtime env"
    return 0
  fi

  case "$service" in
    shared-postgres)
      ssh -F "$SSH_CONFIG_FILE" "$SSH_TARGET" "cd \"\$HOME/$dir\" && set -a && . ./.env && set +a && docker compose exec -T postgres pg_isready -U \"\${POSTGRES_USER:-peg_admin}\" -d \"\${POSTGRES_DB:-peg}\" >/dev/null"
      ;;
    astacus-bot)
      ssh -F "$SSH_CONFIG_FILE" "$SSH_TARGET" "cd \"\$HOME/$dir\" && set -a && . ./.env && set +a && curl -sf http://127.0.0.1:\${API_PORT:-8100}/health >/dev/null"
      ;;
    peg-nightly-landing)
      ssh -F "$SSH_CONFIG_FILE" "$SSH_TARGET" "cd \"\$HOME/$dir\" && set -a && . ./.env && set +a && curl -sf http://127.0.0.1:\${LANDING_PORT:-8200}/ >/dev/null"
      ;;
    peg-session-hub)
      ssh -F "$SSH_CONFIG_FILE" "$SSH_TARGET" "cd \"\$HOME/$dir\" && set -a && . ./.env && set +a && curl -sf http://127.0.0.1:\${SESSION_HUB_PORT:-8201}/health >/dev/null"
      ;;
    peg-live-lobby)
      ssh -F "$SSH_CONFIG_FILE" "$SSH_TARGET" "cd \"\$HOME/$dir\" && set -a && . ./.env && set +a && curl -sf http://127.0.0.1:\${LIVE_LOBBY_PORT:-8202}/health >/dev/null"
      ;;
    peg-tanker-command)
      ssh -F "$SSH_CONFIG_FILE" "$SSH_TARGET" "cd \"\$HOME/$dir\" && set -a && . ./.env && set +a && curl -sf http://127.0.0.1:\${TANKER_COMMAND_PORT:-8203}/health >/dev/null"
      ;;
  esac
}

main() {
  local failed=0
  local services=(shared-postgres astacus-bot peg-nightly-landing peg-session-hub peg-live-lobby peg-tanker-command)

  for service in "${services[@]}"; do
    echo "== $MODE: $service =="
    if [ "$MODE" = "drift" ]; then
      check_drift "$service" || failed=1
    elif [ "$MODE" = "health" ]; then
      check_health "$service" || {
        echo "health: $service failed" >&2
        failed=1
      }
    else
      echo "Unsupported mode: $MODE" >&2
      exit 1
    fi
  done

  exit "$failed"
}

main
