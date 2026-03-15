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
- `python3 -m compileall projects/astacus-bot/api/app` - quick syntax check for the FastAPI app

## Deployment

- `.github/workflows/deploy.yml` publishes the static site to GitHub Pages
- `.github/workflows/deploy-private-service.yml` is the reusable PPaaS-style deploy pipeline for private-host services
- `.github/workflows/deploy-astacus-api.yml`, `.github/workflows/deploy-peg-nightly-landing.yml`, `.github/workflows/deploy-peg-session-hub.yml`, and `.github/workflows/deploy-peg-live-lobby.yml` wire concrete projects into that pipeline
- `.github/workflows/deploy-shared-postgres.yml` deploys the optional shared private Postgres cluster
- `.github/workflows/deploy-private-manual.yml` and `.github/workflows/deploy-private-branch.yml` provide explicit target selection like PPaaS
- the reusable workflow copies `.env.example` and `setup-target.sh`, verifies the host has Docker/Compose access, seeds `.env` if missing, and can replace `.env` from a project-specific GitHub secret
- shared infra credentials can come from the `ppaas` parent repo, while runtime credentials stay project-specific in PEG
- first-time service deploys can now be fully bootstrapped from repo secrets such as `PEG_SHARED_POSTGRES_ENV` and `ASTACUS_BOT_RUNTIME_ENV`

## Shared database mode

If you want multiple PEG APIs to share one private Postgres cluster:

- deploy `infra/shared-postgres/`
- set `USE_SHARED_POSTGRES=true` in the service `.env`
- point `DATABASE_URL` at `peg-shared-postgres`
- keep each project in its own schema, such as `astacus_bot` or `session_hub`

## Architecture

See `docs/platform-architecture.md` and `AGENTS.md` for the operating model.

If Astacus or another sandbox agent seems to have no context, start with `ASTACUS_MEMORY.md`.
