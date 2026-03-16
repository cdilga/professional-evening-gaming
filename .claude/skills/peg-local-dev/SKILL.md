---
name: peg-local-dev
description: Run the full PEG platform locally — shared Postgres, all services, API gateway, and tests
triggers:
  - run locally
  - local dev
  - local setup
  - docker compose
  - start peg
  - run tests
  - bring up the stack
---

# PEG Local Development

Run the full Professional Evening Gaming platform locally with all services connected.

## Quick Start

```bash
# From the repo root:
cp .env.local.example .env.local
docker compose -f docker-compose.local.yml --env-file .env.local up -d
```

This brings up:
- **Postgres 16** on port 55432 (schemas: astacus_bot, session_hub, peg_meta)
- **Astacus Bot API** (FastAPI) on port 8100
- **Session Hub API** (FastAPI) on port 8201
- **Live Lobby** (Node/Fastify) on port 8202
- **Nightly Landing** (static nginx) on port 8200
- **API Gateway** (nginx) on port 8080 — routes `/v1/`, `/session-hub/`, `/live-lobby/`

## Verify Everything Works

```bash
# Gateway health (routes to astacus-bot)
curl localhost:8080/health

# Session Hub through gateway
curl localhost:8080/session-hub/health

# Live Lobby through gateway
curl localhost:8080/live-lobby/health

# Direct service access
curl localhost:8100/health          # astacus-bot
curl localhost:8201/health          # session-hub
curl localhost:8202/health          # live-lobby
```

## Running Tests

```bash
# Live Lobby (Node)
cd projects/peg-live-lobby/app && npm install && npm test

# Astacus Bot (Python)
cd projects/astacus-bot/api && pip install -r requirements.txt && python -m pytest

# Session Hub (Python)
cd projects/peg-session-hub/api && pip install -r requirements.txt && python -m pytest
```

## Common Issues

### "Cannot pull GHCR images"
The compose file uses pre-built images from `ghcr.io/cdilga/professional-evening-gaming-*`. If you can't pull them:
- Authenticate: `echo $GHCR_TOKEN | docker login ghcr.io -u cdilga --password-stdin`
- Or build locally by adding `build: context: ./projects/peg-live-lobby/app` etc. to the compose file

### "Port already in use"
Edit `.env.local` to change any conflicting port. All ports are configurable.

### "peg-services network not found"
The `docker-compose.local.yml` creates this network automatically. If running individual project compose files instead, create it manually: `docker network create peg-services`

### "Schema does not exist"
The init script at `infra/shared-postgres/init/01-schemas.sql` runs on first Postgres startup. If the volume already exists from a previous run, the init won't re-execute. Either:
- Drop the volume: `docker volume rm peg-local-pgdata`
- Or create schemas manually: `docker exec peg-shared-postgres psql -U peg_admin -d peg -c "CREATE SCHEMA IF NOT EXISTS session_hub;"`

## Tear Down

```bash
docker compose -f docker-compose.local.yml --env-file .env.local down
docker compose -f docker-compose.local.yml --env-file .env.local down -v  # also removes volumes
```

## OpenClaw Environments

### Sandbox mode (Discord groups)
- No Docker available. Focus on reading code, running Node tests (`npm test`), and reviewing changes.
- Use `curl` against the live API at `https://peg-api.dilger.dev/` instead of local services.

### Non-sandbox SSH mode
- Full Docker access. Use the quick start above.
- Ensure the SSH host has Docker and docker-compose installed.
- The `peg-services` network and volumes persist between sessions.

## File Reference

| File | Purpose |
|------|---------|
| `docker-compose.local.yml` | Unified local compose — all services + gateway |
| `.env.local.example` | Default env vars for local dev |
| `infra/shared-postgres/init/01-schemas.sql` | Schema creation on first boot |
| `projects/*/infra/docker-compose.yml` | Per-service compose (for production deploys) |
| `projects/*/infra/docker-compose.shared-db.yml` | Shared-DB overlay (production) |
| `projects/*/infra/.env.example` | Per-service env template |
