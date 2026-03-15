# PEG TrueNAS Deploy Runbook

This is the concrete checklist for deploying PEG services onto a private host such as TrueNAS.

## GitHub repo config

Secrets:

- `DEPLOY_USER`
- `CF_CLIENT_ID`
- `CF_CLIENT_SECRET`
- `TRUENAS_SSH_KEY`
- `TRITON_SSH_KEY`
- `PEG_SHARED_POSTGRES_ENV` for `infra/shared-postgres/.env`
- `ASTACUS_BOT_RUNTIME_ENV` for `projects/astacus-bot/.env`
- `PEG_SESSION_HUB_RUNTIME_ENV` for `projects/peg-session-hub/.env`
- `PEG_NIGHTLY_LANDING_RUNTIME_ENV` for `projects/peg-nightly-landing/.env`
- `PEG_LIVE_LOBBY_RUNTIME_ENV` for `projects/peg-live-lobby/.env`

Variables:

- `SSH_TUNNEL_HOSTNAME`
- `TRUENAS_HOST`
- `TRITON_HOST`
- `ACTIVE_TARGET_KEY_SECRET`

Typical value when TrueNAS is active:

- `ACTIVE_TARGET_KEY_SECRET=TRUENAS_SSH_KEY`

## Cloudflare tunnel layout

Suggested hostnames:

- `ssh-deploy.professionaleveninggaming.com` -> `ssh://localhost:22`
- `api.professionaleveninggaming.com` -> public API ingress
- `nightly.professionaleveninggaming.com` -> PEG Nightly Landing
- `lobby.professionaleveninggaming.com` -> PEG Live Lobby

## Host directories used by workflows

- `~/professional-evening-gaming/shared-postgres`
- `~/professional-evening-gaming/astacus-bot`
- `~/professional-evening-gaming/peg-nightly-landing`
- `~/professional-evening-gaming/peg-session-hub`
- `~/professional-evening-gaming/peg-live-lobby`

## Shared Postgres first

Deploy shared Postgres before any service that uses schema-per-project mode.

Shared Postgres env example:

```env
POSTGRES_DB=peg
POSTGRES_USER=peg_admin
POSTGRES_PASSWORD=replace-with-real-secret
POSTGRES_PORT=5432
```

Deploy choices:

- push changes that touch `infra/shared-postgres/`
- run `.github/workflows/deploy-shared-postgres.yml`
- or use `.github/workflows/deploy-private-manual.yml` with `project=shared-postgres`

## Astacus Bot defaults

Astacus is now the reference shared-cluster project.

Its runtime env should look like:

```env
POSTGRES_DB=peg
POSTGRES_USER=astacus
POSTGRES_PASSWORD=replace-with-real-secret
DATABASE_URL=postgresql://astacus:replace-with-real-secret@peg-shared-postgres:5432/peg
API_PORT=8100
TUNNEL_TOKEN=replace-with-cloudflare-token
ENABLE_TUNNEL=false
CORS_ORIGINS=https://professional-evening-gaming.dilger.dev
GHCR_USERNAME=your-github-username
GHCR_TOKEN=replace-with-ghcr-pat
USE_SHARED_POSTGRES=true
```

Astacus migrations own the `astacus_bot` schema.

## Session Hub shared-cluster option

```env
POSTGRES_DB=peg
POSTGRES_USER=session_hub
POSTGRES_PASSWORD=replace-with-real-secret
DATABASE_URL=postgresql://session_hub:replace-with-real-secret@peg-shared-postgres:5432/peg
SESSION_HUB_PORT=8201
TUNNEL_TOKEN=replace-with-cloudflare-token
CORS_ORIGINS=https://professional-evening-gaming.dilger.dev
GHCR_USERNAME=your-github-username
GHCR_TOKEN=replace-with-ghcr-pat
USE_SHARED_POSTGRES=true
```

Session Hub migrations own the `session_hub` schema.

## Simple service envs

PEG Nightly Landing:

```env
LANDING_PORT=8200
TUNNEL_TOKEN=replace-with-cloudflare-token
GHCR_USERNAME=your-github-username
GHCR_TOKEN=replace-with-ghcr-pat
```

PEG Live Lobby:

```env
LIVE_LOBBY_PORT=8202
TUNNEL_TOKEN=replace-with-cloudflare-token
GHCR_USERNAME=your-github-username
GHCR_TOKEN=replace-with-ghcr-pat
```

## Deployment modes

Normal mode:

- push to `main`

Manual targeted deploys:

- run `.github/workflows/deploy-private-manual.yml`

Branch-targeted deploys:

- `deploy/truenas/shared-postgres`
- `deploy/truenas/astacus-bot`
- `deploy/truenas/peg-session-hub`
- `deploy/truenas/peg-nightly-landing`
- `deploy/truenas/peg-live-lobby`

Use `triton` instead of `truenas` to target the other host.

## Ongoing automation

- push/manual/branch deploys rewrite remote `.env` from the matching GitHub secret when that secret is set
- `.github/workflows/service-healthcheck.yml` runs every 30 minutes against the active host
- `.github/workflows/deployment-drift.yml` runs nightly and checks remote deployment files against repo copies
- service deploy scripts write `.deploy-state` so drift checks can compare the recorded tag to the running container image

## Rollout order

1. Ensure Docker and Docker Compose access exist for `DEPLOY_USER`
2. Configure Cloudflare tunnel ingress and SSH hostname
3. Set GitHub secrets and variables
4. Deploy shared Postgres
5. Deploy Astacus Bot
6. Deploy other services as needed

## Health checks

- `curl http://127.0.0.1:5432` is not useful; validate Postgres via service migrations or `pg_isready`
- `curl http://127.0.0.1:8100/health`
- `curl http://127.0.0.1:8200/`
- `curl http://127.0.0.1:8201/health`
- `curl http://127.0.0.1:8202/health`

## Important assumptions

- Docker and Compose are already provisioned for the deploy user
- Postgres remains private
- GHCR pull credentials are valid if the images are private
- Cloudflare Access service-token auth is configured for CI SSH
