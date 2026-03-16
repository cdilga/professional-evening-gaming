# PEG Agent Guide

This repository is the control plane for Professional Evening Gaming.

`CLAUDE.md` should mirror this file exactly; keep the symlink intact so agent tooling lands on one source of truth.

Before doing anything substantial, read `ASTACUS_MEMORY.md` for the sandbox brief and current architectural facts.

## Mission

- keep the homepage sharp, playful, and easy to edit
- keep `/projects/` permanently accessible from the main nav
- treat every project under `projects/` as an independent lane
- prefer contracts and repeatable deploy patterns over one-off hacks

## Repository map

- `ASTACUS_MEMORY.md` - first-read memory file for sandbox agents
- `site/` - public GitHub Pages content
- `projects/<slug>/peg-project.json` - the shared contract for project discovery
- `projects/<slug>/api` or other source folders - fully project-specific code
- `projects/<slug>/infra` - project-specific compose and deploy assets
- `templates/project-starter/` - starter contract for new projects
- `templates/static-site-project/`, `templates/python-fastapi-postgres/`, `templates/node-fastify-service/` - reference starter lanes
- `infra/shared-postgres/` - optional shared private Postgres cluster for multi-service schema isolation
- `docs/platform-architecture.md` - architectural intent
- `docs/truenas-deploy-runbook.md` - exact private-host and Cloudflare deployment checklist

## Rules for adding or editing projects

1. Keep the landing page and `/projects/` working even if a project is half-built.
2. Register every real project with `projects/<slug>/peg-project.json`.
3. Let each project choose its own stack; do not force all projects into one toolchain.
4. If a project needs storage, give it a dedicated Postgres schema where practical.
5. Do not expose Postgres directly to the public internet; put FastAPI or another API in front.
6. Prefer project-local deploy files and workflows that reuse the PPaaS cloudflared-over-SSH pattern.

## Astacus-specific notes

- the first backend project is `projects/astacus-bot/`
- reference implementations also live in `projects/peg-nightly-landing/`, `projects/peg-session-hub/`, and `projects/peg-live-lobby/`
- deploys are expected to run migrations during rollout
- the static site should call the API through a public hostname with CORS enabled
- the avatar currently uses a local placeholder at `site/assets/img/astacus-avatar.svg`; replace it with a Discord-hosted image when a stable URL is available
- service workflows copy `setup-target.sh` and `.env.example`, then run host bootstrap before deploy
- every service project still needs real values in `~/professional-evening-gaming/<slug>/.env` before deploys can succeed
- future deploys should treat GitHub runtime-env secrets as the source of truth for remote `.env` files
- for schema-per-project on one cluster, deploy `infra/shared-postgres/` first and set `USE_SHARED_POSTGRES=true` in the service env
- manual targeted deploys use `.github/workflows/deploy-private-manual.yml`; branch-targeted deploys use `deploy/<target>/<project>`
- periodic automation now includes `.github/workflows/service-healthcheck.yml` and `.github/workflows/deployment-drift.yml`
- current runtime-env secrets were synced from `truenas`; do not assume `triton` can diverge safely until target-specific secrets exist

## Content and vibe guidance

- PEG should feel like disciplined engineers relaxing with dangerous little prototypes
- favor confident, slightly theatrical copy over bland startup filler
- preserve mobile usability and direct navigation

## Build and test checklist

Run the smallest useful set for the area you touched, then finish with the full pass before handoff on larger changes.

- `npm run validate:projects` - validate all project contracts and page wiring
- `npm run build:site` - rebuild the public Pages artifact into `dist/`
- `npm run test:unit` - Python API tests plus the Node live-lobby test suite
- `npm run test:integration` - build the site and verify cross-project wiring in `dist/`
- `python3 scripts/run_integration_checks.py --live` - optional live smoke against the public PEG API host

Project-specific shortcuts:

- `python3 -m compileall projects/astacus-bot/api/app`
- `python3 -m compileall projects/peg-session-hub/api/app`
- `npm --prefix projects/peg-live-lobby/app test`

## Expectations for service-backed projects

- every service project should have a project page that proves the thing works, not just explains architecture
- prefer browser-facing demos that hit the live API path where practical
- if a project needs durable state, wire it to its own schema and show that state on the page
- if deployment files change, review the matching workflow, compose files, runtime env, and host health path together

## Memory refresh checklist

If an agent seems lost, re-ground it with these files in this order:

1. `ASTACUS_MEMORY.md`
2. `AGENTS.md`
3. `docs/platform-architecture.md`
4. the relevant `projects/<slug>/peg-project.json`
