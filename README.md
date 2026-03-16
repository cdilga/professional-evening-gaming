# Professional Evening Gaming

PEG now has two layers:

- `site/` for the public GitHub Pages homepage and project index
- `projects/` for independently-shaped project lanes, starting with `astacus-bot`

Reference projects currently included:

- `projects/astacus-bot/` - FastAPI + Postgres bot backend
- `projects/peg-nightly-landing/` - standalone static microsite
- `projects/peg-session-hub/` - FastAPI + Postgres planner
- `projects/peg-live-lobby/` - Node + Fastify realtime service

## Commands

- `npm run validate:projects` - validate all project contracts
- `npm run build:site` - build the static site into `dist/`
- `npm run test:unit` - run Python API tests and the Node live-lobby test suite
- `npm run test:integration` - rebuild the site and verify end-to-end project wiring
- `python3 scripts/run_integration_checks.py --live` - optional public live smoke against the PEG API host
- `python3 -m compileall projects/astacus-bot/api/app` - quick syntax check for the Astacus FastAPI app
- `python3 -m compileall projects/peg-session-hub/api/app` - quick syntax check for the Session Hub FastAPI app

## Deployment

- `.github/workflows/deploy.yml` publishes the static site to GitHub Pages
- `.github/workflows/deploy-private-service.yml` is the reusable PPaaS-style deploy pipeline for private-host services
- `.github/workflows/deploy-astacus-api.yml`, `.github/workflows/deploy-peg-nightly-landing.yml`, `.github/workflows/deploy-peg-session-hub.yml`, and `.github/workflows/deploy-peg-live-lobby.yml` wire concrete projects into that pipeline
- `.github/workflows/deploy-shared-postgres.yml` deploys the optional shared private Postgres cluster
- `.github/workflows/deploy-private-manual.yml` and `.github/workflows/deploy-private-branch.yml` provide explicit target selection like PPaaS
- `.github/workflows/service-healthcheck.yml` runs periodic host-local health checks
- `.github/workflows/deployment-drift.yml` checks for drift between repo deployment files and what is on the host
- the reusable workflow copies `.env.example` and `setup-target.sh`, verifies the host has Docker/Compose access, seeds `.env` if missing, and then rewrites `.env` from the matching project GitHub secret when one is configured
- shared infra credentials can come from the `ppaas` parent repo, while runtime credentials stay project-specific in PEG
- first-time service deploys can now be fully bootstrapped from repo secrets such as `PEG_SHARED_POSTGRES_ENV` and `ASTACUS_BOT_RUNTIME_ENV`

Recommended runtime env secrets:

- `PEG_SHARED_POSTGRES_ENV`
- `ASTACUS_BOT_RUNTIME_ENV`
- `PEG_SESSION_HUB_RUNTIME_ENV`
- `PEG_NIGHTLY_LANDING_RUNTIME_ENV`
- `PEG_LIVE_LOBBY_RUNTIME_ENV`

The periodic audits are intentionally lightweight:

- healthcheck verifies local service endpoints and shared Postgres readiness on the active host
- drift audit compares deployed compose/scripts/env-example files against the repo and checks recorded image tags against the running containers

Current assumption:

- the runtime env secrets were synced from the live `truenas` host
- deploys will therefore assume `triton` can use the same runtime env unless and until target-specific secrets are added

## Shared database mode

If you want multiple PEG APIs to share one private Postgres cluster:

- deploy `infra/shared-postgres/`
- Astacus Bot already defaults to `USE_SHARED_POSTGRES=true`
- set `USE_SHARED_POSTGRES=true` in any other service `.env`
- point `DATABASE_URL` at `peg-shared-postgres`
- keep each project in its own schema, such as `astacus_bot` or `session_hub`

See `docs/truenas-deploy-runbook.md` for the exact host, secrets, tunnel, and rollout setup.

## Architecture

See `docs/platform-architecture.md` and `AGENTS.md` for the operating model.

`CLAUDE.md` is intentionally a symlink to `AGENTS.md` so local agent tooling gets the same repo instructions.

If Astacus or another sandbox agent seems to have no context, start with `ASTACUS_MEMORY.md`.
