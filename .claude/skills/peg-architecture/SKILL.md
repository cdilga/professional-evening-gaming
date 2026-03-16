---
name: peg-architecture
description: PEG platform architecture, philosophy, project isolation model, and deployment topology
triggers:
  - architecture
  - platform design
  - how does peg work
  - project structure
  - deployment model
  - add a new project
---

# PEG Architecture & Philosophy

Professional Evening Gaming is a platform for after-hours game experiments. The architecture serves one core idea: **each project gets its own lane without the bullshit**.

## Philosophy

**"Not a monorepo prison. More like a sketchbook with deploy keys."**

- The front door stays hand-drawn and sassy (Permanent Marker font, crayon colors, bouncing ball energy)
- Every project owns its own language, Dockerfile, CI path, runtime, and schema
- The platform provides shared infrastructure (Postgres, API gateway, tunnels) without forcing coupling
- Projects can be as simple as static HTML or as complex as a FastAPI + Postgres + WebSocket stack
- The repo can host mixed tooling without collapsing into one giant app

## Design Language: "Sassy Sasquatch"

The visual identity is intentionally hand-drawn and unpolished:
- **Fonts**: Permanent Marker (headings), Kalam (body), Patrick Hand (brand), IBM Plex Mono (labels)
- **Colors**: Warm cream/parchment background (#f5f0e6), brown text (#3d2b1f), burnt sienna accents (#a0522d), forest green status (#266d3e), orange primary (#ff8c42)
- **Panels**: Wobbly border-radius (`20px 255px 20px 25px / 255px 20px 225px 20px`), hand-shadow effect
- **Tone**: Australian shed energy — "nah yeah", "fair dinkum", "mind the dart smoke"
- **WCAG**: All text meets AA contrast ratios despite the playful palette

## Project Isolation Model

Each project lives under `projects/<name>/` and declares itself via `peg-project.json`:

```json
{
  "slug": "peg-live-lobby",
  "name": "PEG Live Lobby",
  "summary": "Realtime lobby and ready-check service",
  "tagline": "A Node-based API lane proving PEG projects can swap runtime",
  "featured": true,
  "order": 40,
  "status": "live demo online",
  "stack": { "frontend": null, "api": "fastify", "database": "file" },
  "links": { "page": "/projects/peg-live-lobby/", "repoPath": "projects/peg-live-lobby" }
}
```

The build script (`scripts/build-site.mjs`) collects all `peg-project.json` files into `/data/projects.json`, which the site JS uses to render project cards dynamically.

## Network Topology

```
GitHub Pages (site/)
    ↓ fetch()
peg-api.dilger.dev (Cloudflare tunnel → nginx gateway)
    ├── /health, /v1/*           → astacus-bot (FastAPI, port 8000)
    ├── /session-hub/*           → session-hub (FastAPI, port 8000)
    ├── /live-lobby/*            → live-lobby  (Fastify, port 3000)
    └── /live-lobby/ws           → live-lobby  (WebSocket upgrade)

Docker network: peg-services (bridge)
    ├── peg-shared-postgres      (Postgres 16, schemas per project)
    ├── peg-astacus-api
    ├── peg-session-hub-api
    ├── peg-live-lobby
    ├── peg-nightly-landing      (isolated, no shared network)
    └── peg-api-gateway          (nginx, port 8080)
```

### API Gateway Routing

The nginx gateway uses `resolver 127.0.0.11 valid=10s ipv6=off` with `set` variables for cross-service upstreams. This forces per-request DNS resolution over IPv4 only, preventing the IPv6 caching issue that caused session-hub requests to fall through to astacus-bot.

## Deployment Architecture

```
Push to main
    → GitHub Actions (per-project workflow)
        → Build Docker image
        → Push to GHCR
        → SSH via Cloudflare tunnel to private host
        → docker compose pull && up -d
        → curl /health to verify
```

Each project has:
- `.github/workflows/deploy-peg-<name>.yml` — triggers on path changes
- `projects/<name>/infra/docker-compose.yml` — production compose
- `projects/<name>/infra/docker-compose.shared-db.yml` — overlay for shared Postgres mode
- `projects/<name>/infra/scripts/deploy.sh` — pull, restart, health check

### Two Repos

| Repo | Purpose |
|------|---------|
| `cdilga/professional-evening-gaming` | PEG platform: site, all project code, CI/CD, infra |
| `cdilga/ppaas` | Parent provisioner: manages secrets rotation across all managed repos |

## Adding a New Project

1. Create `projects/<name>/` with app code and Dockerfile
2. Create `projects/<name>/peg-project.json` with metadata
3. Create `projects/<name>/infra/docker-compose.yml` (follow live-lobby as template)
4. Create a demo page at `site/projects/<name>/index.html`
5. Add a deploy workflow at `.github/workflows/deploy-peg-<name>.yml`
6. If it needs Postgres: add a schema to `infra/shared-postgres/init/01-schemas.sql` and create a `docker-compose.shared-db.yml` overlay

The site will auto-discover the project from its `peg-project.json` on next build.

## The Four Reference Projects

| Project | Runtime | Database | Purpose |
|---------|---------|----------|---------|
| **Astacus Bot** | FastAPI | Postgres (astacus_bot schema) | Discord ops bot, full service lane proof |
| **Session Hub** | FastAPI | Postgres (session_hub schema) | Session planning with CRUD + migrations |
| **Live Lobby** | Node/Fastify | File-based JSON | Realtime WebSocket + cross-service integration |
| **Nightly Landing** | Static nginx | None | Pure static microsite, no backend needed |

These four projects prove the platform handles Python, Node, static, database-backed, file-backed, REST, and WebSocket workloads through one deployment model.
