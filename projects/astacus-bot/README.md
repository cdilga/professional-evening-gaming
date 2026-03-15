# Astacus Bot

This project provides the first service-backed PEG lane.

- `api/` contains the FastAPI app and SQL-file migration runner
- `infra/` contains the compose stack and remote deploy script
- `peg-project.json` registers the project with the shared homepage and projects index

The database stays private on the compose network. The API is the only public surface and is intended to sit behind Cloudflare tunnel ingress.
