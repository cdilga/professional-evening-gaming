# Python FastAPI + Postgres Starter

Use `projects/astacus-bot/` and `projects/peg-session-hub/` as the reference implementations.

- FastAPI app in `api/app/`
- SQL-file migrations in `api/migrations/`
- dedicated Postgres schema per project
- deploy script runs migrations before restarting the API
- optional shared-cluster mode via `docker-compose.shared-db.yml` and `USE_SHARED_POSTGRES=true`
