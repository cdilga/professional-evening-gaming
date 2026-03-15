# PEG Platform Architecture

## Core model

The repository acts as a shared control plane, not a single build pipeline.

- `site/` is the public static shell deployed to GitHub Pages
- `projects/<slug>/` is a self-contained project lane with its own contract and source tree
- `scripts/build-site.mjs` scans project contracts and generates the public project registry
- service-backed projects can deploy independently through GitHub Actions and Docker images

Current reference lanes:

- `astacus-bot` - FastAPI + Postgres bot backend
- `peg-nightly-landing` - static-only nginx microsite
- `peg-session-hub` - FastAPI + Postgres planning service
- `peg-live-lobby` - Node + Fastify + websocket service

## Public web + private services

The public site stays static so the lads can freely change the landing page without touching backend infrastructure.

For anything dynamic:

- static pages call a dedicated API hostname
- the API sits behind Cloudflare tunnel ingress
- Postgres stays private on the Docker network
- CORS allows the Pages domain to call the API directly

## Database strategy

Each project that needs durable state should get a dedicated PostgreSQL schema.

There are two supported deployment shapes:

- simplest default: one Postgres container per service project, with that project owning its own schema inside that container
- advanced shared-data mode: point multiple service projects at the same private Postgres cluster and separate them by schema

Current examples:

- `astacus_bot` for Discord-driven notes and future bot state
- `session_hub` for scheduling and planning data
- `peg_meta` for migration tracking

Recommended next schemas:

- `scoreboards`
- `matchmaking`
- `playtests`

## Deployment model

### Site

`main` pushes run `npm run build:site`, upload `dist/`, and publish to GitHub Pages.

### Services

Service workflows follow the PPaaS pattern via `.github/workflows/deploy-private-service.yml`:

1. build and push an image to GHCR
2. open SSH access through `cloudflared access tcp`
3. copy compose and deploy files to the private host
4. rely on a one-time host `.env` bootstrap for runtime secrets and GHCR pull credentials
5. pull the new image
6. run migrations
7. restart the service stack
8. curl `/health`

Service projects should also ship `infra/scripts/setup-target.sh` so a new private host can be bootstrapped the same way PPaaS bootstraps targets. In PEG, those scripts are intentionally conservative: they verify Docker/Compose access, create the app directory, and seed `.env`, but they do not try to mutate host package management. That is the safer fit for managed hosts like TrueNAS.

### Shared Postgres mode

PEG now supports a shared private Postgres cluster in `infra/shared-postgres/`.

- deploy it with `.github/workflows/deploy-shared-postgres.yml`
- it exposes the Docker network `peg-services`
- service projects can opt in by setting `USE_SHARED_POSTGRES=true`
- service projects then use `docker-compose.shared-db.yml` and a `DATABASE_URL` that points at `peg-shared-postgres`

Example shared-cluster URLs:

- `postgresql://astacus:secret@peg-shared-postgres:5432/peg`
- `postgresql://session_hub:secret@peg-shared-postgres:5432/peg`

`astacus-bot` is the reference project that now defaults to this shared-cluster mode.

The point is not one giant app database; it is one private cluster with per-project schemas and independent app deploys.

### Targeted deploys

PEG now has PPaaS-style targeted deploy workflows too:

- `.github/workflows/deploy-private-manual.yml` for workflow-dispatch deploys to `truenas` or `triton`
- `.github/workflows/deploy-private-branch.yml` for branch-driven deploys like `deploy/truenas/astacus-bot`

That gives you three deployment modes overall:

- push to `main` for normal active-target deploys
- workflow dispatch for explicit target selection
- deploy branches for quick directed rollouts

## Why this is more flexible than a conventional monorepo tool

The shared repo only standardizes discovery and deployment contracts. It does not force projects into one package manager, one workspace tool, or one build graph.

Each project may choose:

- Python, Rust, Node, Go, or something else
- Docker or no Docker
- frontend-only, API-only, or hybrid
- no database, shared database, or dedicated schema
