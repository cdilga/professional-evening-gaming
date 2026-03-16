---
name: peg-dev-workflow
description: How to break down PEG work — task management, meta-planning, deployment verification, and agent workflow for Kimi K2.5 and other agents
triggers:
  - how to develop
  - development workflow
  - task management
  - deployment process
  - how to deploy
  - agent workflow
  - kimi
  - openclaw
---

# PEG Development Workflow

How to work on PEG projects effectively — whether you're Claude, Kimi K2.5, or another agent in OpenClaw.

## The Three Phases

### Phase 1: Research

Before writing code, understand the current state:

```bash
# What services exist and their health
curl https://peg-api.dilger.dev/health
curl https://peg-api.dilger.dev/session-hub/health
curl https://peg-api.dilger.dev/live-lobby/health

# What the codebase looks like
ls projects/*/peg-project.json        # project contracts
cat docs/platform-architecture.md      # design intent
git log --oneline -10                  # recent changes
```

Read the files you'll modify before planning changes. Read test files to understand expected behavior. Read deploy scripts to understand the deployment path.

### Phase 2: Plan

Break work into discrete tasks with dependencies:

1. **Create tasks** — each task should be a single commit's worth of work
2. **Set dependencies** — if task B needs task A's output, mark it
3. **Start with the smallest unblocked task** — build momentum
4. **Update tasks as you learn** — plans change, keep the task list current

Example task breakdown for "add feature X to Live Lobby":
- Task 1: Update server.js with new endpoint + tests
- Task 2: Update site.js demo to call the endpoint
- Task 3: Update CSS for any new UI elements
- Task 4: Commit, push, verify deploy

### Phase 3: Implement

For each task:

1. **Write the code** — edit the minimum files needed
2. **Run tests** — `cd projects/peg-live-lobby/app && npm test` (or pytest for Python services)
3. **Commit with a descriptive message** — explain the "why", not just the "what"
4. **Push** — triggers GitHub Actions deploy
5. **Verify** — `curl` the health endpoint to confirm the deploy landed

## Deployment Process

### How It Works

```
git push to main
  → GitHub Actions detects which project changed (path filters)
  → Builds Docker image, pushes to GHCR
  → SSHs to private host via Cloudflare tunnel
  → Runs deploy.sh: docker compose pull && up -d
  → Curls /health to verify
```

### Verify After Deploy

```bash
# Check CI status
gh run list --limit 5

# Wait for completion, then verify
curl https://peg-api.dilger.dev/session-hub/health
curl https://peg-api.dilger.dev/live-lobby/health
curl https://peg-api.dilger.dev/health
```

### If a Deploy Fails

1. Check the GitHub Actions log: `gh run view <run-id> --log`
2. Common issues:
   - Docker build failure → fix the Dockerfile or code error
   - SSH connection failure → Cloudflare tunnel may be down
   - Health check failure → the service started but isn't healthy, check logs

## Git Workflow

- **Single branch**: `main` — pushes trigger deploys
- **Descriptive commits**: start with verb, explain the why
- **Co-author**: add `Co-Authored-By: <agent> <email>` to commits
- **No force push**: main is the source of truth
- **Path-filtered CI**: only the changed project's workflow runs

## Testing Strategy

| Project | Command | Framework |
|---------|---------|-----------|
| Live Lobby | `cd projects/peg-live-lobby/app && npm test` | Node test runner |
| Astacus Bot | `cd projects/astacus-bot/api && python -m pytest` | pytest |
| Session Hub | `cd projects/peg-session-hub/api && python -m pytest` | pytest |
| Static site | Manual: build with `node scripts/build-site.mjs`, check output |

Always run tests before committing. Tests should pass locally before pushing.

## Working Across Project Types

### Python services (astacus-bot, session-hub)
- FastAPI apps in `projects/<name>/api/app/main.py`
- psycopg for Postgres, pydantic for validation
- Migrations run at container startup
- Tests: pytest with httpx TestClient

### Node services (live-lobby)
- Fastify app in `projects/<name>/app/src/server.js`
- ES modules (`"type": "module"` in package.json)
- Tests: Node built-in test runner with `app.inject()` for HTTP testing
- `buildApp({ statePath })` pattern for test isolation

### Static sites (nightly-landing)
- Plain HTML/CSS/JS in `projects/<name>/web/`
- Served by nginx in Docker
- No tests, no build step

## OpenClaw Environments

### Sandbox Mode (Discord groups)
**Constraints**: No Docker, no SSH, limited filesystem access.

**What you can do**:
- Read and edit code
- Run Node tests (`npm test` — no Docker needed)
- Run Python tests if dependencies are installed
- Review git history and plan changes
- Prepare commits

**What you can't do**:
- Run Docker compose
- Deploy (no SSH access to host)
- Test API gateway routing locally

**Workaround**: Use the live API at `https://peg-api.dilger.dev/` for verification. Push changes and let CI deploy, then verify with curl.

### Non-sandbox SSH Mode
**Full access**: Docker, git, SSH, everything.

**Startup**:
```bash
cd /path/to/professional-evening-gaming
cp .env.local.example .env.local
docker compose -f docker-compose.local.yml --env-file .env.local up -d
# Full platform running locally on port 8080
```

**Development loop**:
1. Edit code
2. Rebuild specific service: `docker compose -f docker-compose.local.yml --env-file .env.local up -d --build live-lobby`
3. Test: `curl localhost:8080/live-lobby/health`
4. When ready: commit, push, verify production deploy

## Meta-Planning Pattern

For large features that span multiple sessions:

1. **Start by reading** — understand the current state, don't assume
2. **Create a task list** — break into commit-sized chunks
3. **Work depth-first** — finish one task completely before starting the next
4. **Commit often** — each task = one commit, push frequently
5. **Verify after each push** — don't accumulate unverified changes
6. **Update the plan** — if you discover something changes the approach, update tasks before continuing
7. **Save learnings to memory** — if you discover something non-obvious (e.g., IPv6 DNS caching breaks nginx), save it so future agents don't re-discover it

## Common Patterns

### Adding a new API endpoint to Live Lobby
1. Add route in `projects/peg-live-lobby/app/src/server.js`
2. Add test in `projects/peg-live-lobby/app/test/server.test.js`
3. Add demo UI in `site/assets/js/site.js` (in the `setupLiveLobbyDemo` function)
4. Run `npm test`, commit, push

### Adding a new demo page
1. Create `site/projects/<name>/index.html` (copy live-lobby's as template)
2. Add demo logic in `site/assets/js/site.js`
3. Add CSS in `site/assets/css/site.css` if needed
4. Ensure `peg-project.json` has correct `links.page` path

### Debugging a routing issue
1. Check gateway health: `curl peg-api.dilger.dev/health`
2. Check individual service: `curl peg-api.dilger.dev/<prefix>/health`
3. If wrong service responds, check `docker-compose.shared-db.yml` nginx config
4. Common cause: IPv6 DNS resolution — ensure `resolver 127.0.0.11 valid=10s ipv6=off`
