# Astacus Memory

Read this first when you enter the PEG sandbox.

## What this repo is

Professional Evening Gaming is not one app. It is a shared control plane for:

- a static public site on GitHub Pages
- a permanent `/projects/` index
- independent project lanes under `projects/`
- service deployments that can use GitHub Actions, GHCR, Cloudflare tunnel, Docker Compose, FastAPI, and Postgres

## Current truths

- the public site source is in `site/`
- the built Pages artifact is `dist/`
- the project registry is generated from `projects/*/peg-project.json`
- the generator is `scripts/build-site.mjs`
- the main static deploy workflow is `.github/workflows/deploy.yml`
- the first service-backed project is `projects/astacus-bot/`
- the first API deploy workflow is `.github/workflows/deploy-astacus-api.yml`
- reusable private-host service deploys go through `.github/workflows/deploy-private-service.yml`
- additional examples now exist in `projects/peg-nightly-landing/`, `projects/peg-session-hub/`, `projects/peg-live-lobby/`, and `projects/peg-tanker-command/`
- shared private Postgres lives in `infra/shared-postgres/`
- targeted deploy workflows live in `.github/workflows/deploy-private-manual.yml` and `.github/workflows/deploy-private-branch.yml`
- `docs/truenas-deploy-runbook.md` is the exact deployment runbook
- remote `.env` files are meant to be reconciled from project-specific GitHub secrets on deploy
- periodic audits live in `.github/workflows/service-healthcheck.yml` and `.github/workflows/deployment-drift.yml`
- current runtime-env secrets were copied from the live `truenas` host, so `triton` is only safe if it can share that same config

## How projects work

Each real project should have its own directory like `projects/<slug>/`.

Minimum contract:

- `projects/<slug>/peg-project.json`
- a public page at `/projects/<slug>/`
- whatever source tree that project actually needs

Important rule: the root repo indexes projects, but does not force them into one language, one package manager, or one build graph.

## Astacus Bot facts

- project root: `projects/astacus-bot/`
- API source: `projects/astacus-bot/api/`
- infra files: `projects/astacus-bot/infra/`
- database: Postgres 16
- main schema: `astacus_bot`
- migration tracking schema: `peg_meta`
- deploy pattern: build image -> push GHCR -> cloudflared SSH -> copy compose/deploy files -> pull image -> run migrations -> restart services -> hit `/health`

## Other reference projects

- `peg-nightly-landing` - static-only nginx microsite, no database
- `peg-session-hub` - FastAPI + Postgres with `session_hub` schema and migrations
- `peg-live-lobby` - Node + Fastify + websocket service, no forced database
- `peg-tanker-command` - Node canvas game service exposed through the shared PEG API gateway

## What must stay true

- `/projects/` must always remain reachable from the main nav
- the homepage can be playful and editable, but project discovery must stay reliable
- Postgres must not be public; put an API in front of it
- service-backed projects should prefer dedicated schemas
- deployment changes should preserve the PPaaS-style remote rollout pattern

## Commands you probably want

- `npm run validate:projects`
- `npm run build:site`
- `npm run test:unit`
- `npm run test:integration`
- `python3 -m compileall projects/astacus-bot/api/app`
- `node --test projects/peg-tanker-command/app/test/server.test.js`

## Manual host assumptions

The Astacus host needs a real runtime env file at:

- `~/professional-evening-gaming/astacus-bot/.env`

Create it from:

- `projects/astacus-bot/infra/.env.example`

That host env file must contain:

- Postgres credentials
- `DATABASE_URL`
- `TUNNEL_TOKEN`
- `CORS_ORIGINS`
- `GHCR_USERNAME` and `GHCR_TOKEN` if the image is private

Every service-backed PEG project follows the same pattern:

- `~/professional-evening-gaming/<slug>/.env`
- copied from `projects/<slug>/infra/.env.example`
- bootstrapped with `projects/<slug>/infra/scripts/setup-target.sh`
- `setup-target.sh` is copied and run automatically by the reusable deploy workflow, but the `.env` still needs real secrets filled in

For shared database mode:

- deploy `infra/shared-postgres/`
- Astacus Bot now defaults to `USE_SHARED_POSTGRES=true`
- point `DATABASE_URL` at `peg-shared-postgres`
- keep migrations scoped to the project's schema

## If you are asked to add a project

1. Copy `templates/project-starter/` to `projects/<slug>/`
2. Fill `peg-project.json`
3. Add project-local code and infra
4. Add or update a public page under `site/projects/<slug>/index.html`
5. Run validation and site build
