# Projects Contract

Every PEG project gets a dedicated directory under `projects/` and a `peg-project.json` contract.

That contract is the only thing the shared landing page cares about. Everything else can be project-specific:

- language and framework
- package manager and lockfile
- Dockerfile and image layout
- GitHub Actions workflow
- runtime shape and database schema

## Add a project

1. Copy `templates/project-starter/` into `projects/<slug>/`
2. Update `projects/<slug>/peg-project.json`
3. Add whatever source tree the project needs
4. Run `npm run validate:projects`
5. Run `npm run build:site`

The site build scans every `projects/*/peg-project.json` file and generates `dist/data/projects.json` for the homepage and `/projects/` index.

## Reference projects

- `projects/astacus-bot/` - FastAPI + Postgres bot backend with migration-on-deploy
- `projects/peg-nightly-landing/` - static-only nginx microsite
- `projects/peg-session-hub/` - FastAPI + Postgres planning service
- `projects/peg-live-lobby/` - Node + Fastify + websocket realtime service
