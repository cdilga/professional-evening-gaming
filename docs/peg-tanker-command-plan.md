# PEG Tanker Command plan

## Goal

Ship a new PEG project lane for a deployable live multiplayer tanker game with a shared war map, fictional factions, AI drone attacks, scoring, and a dashboard driven by live game events.

## Product direction

- Players control tankers in a shared online lobby.
- Tankers do not shoot.
- AI drones threaten convoys and create the main combat pressure.
- Factions are fictional stand-ins, not real nations.
- Dashboard state is downstream from actual game events.
- Unsupported-browser users from the main site should get sent somewhere intentional, so the compatibility notice will link to this lane.

## Strongest runnable slice in this repo

1. New project lane: `projects/peg-tanker-command/`
2. New Node + Fastify + WebSocket service with file-persisted game state.
3. Public project page: `/projects/peg-tanker-command/`
4. Shared realtime loop:
   - join a faction
   - spawn or reconnect tanker
   - movement controls
   - drone spawning and ballistic dive attacks
   - scoring, deliveries, losses, faction control
5. Dashboard cards and leaderboard sourced from live server state.
6. Deploy wiring consistent with existing PEG service patterns.
7. Tests for core game/server behaviour.

## Technical shape

- Reuse the PEG live-lobby runtime pattern: Fastify, `@fastify/websocket`, persisted JSON state, Docker, GHCR, cloudflared SSH deploy workflow.
- Keep game simulation server-side so dashboard and gameplay share one source of truth.
- Use a canvas client on the public project page for the map and live rendering.
- Use REST for join/input and WebSocket for realtime snapshots.

## Simplifications for this iteration

- One shared room.
- Simplified top-down tanker handling.
- Drones use an Angry-Birds-ish ballistic swoop feel rather than full rigid-body physics.
- No auth, matchmaking, or anti-cheat yet.
- Dashboard is embedded in the project page rather than split into a second app.

## Done when

- New project contract validates.
- Public page renders a playable shared map client.
- Game events update scoreboard/dashboard metrics.
- Repo includes deploy workflow and infra for the new service.
- Tests pass as far as sandbox allows.
- Changes are committed on a branch.
