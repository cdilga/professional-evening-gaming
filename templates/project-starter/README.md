# New PEG Project Starter

This is a skeleton for a new PEG project.

- keep the `peg-project.json` contract accurate
- add whatever source layout the project needs
- if it needs state, give it its own schema and migration path
- if it needs deployment, add a project-local workflow or a workflow that calls a reusable one

For fuller examples, copy from:

- `projects/peg-nightly-landing/` for static-only deploys
- `projects/peg-session-hub/` or `projects/astacus-bot/` for FastAPI + Postgres
- `projects/peg-live-lobby/` for Node + Fastify services
