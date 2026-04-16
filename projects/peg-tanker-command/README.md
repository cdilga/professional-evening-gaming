# PEG Tanker Command

Deployable realtime PEG game lane.

- Node.js + Fastify + WebSocket service
- shared tanker map with fictional factions
- AI drone attacks with ballistic dive behaviour
- file-persisted state for scoreboard and dashboard continuity
- public canvas client under `site/projects/peg-tanker-command/`

## What this proves

- PEG can host a live multiplayer game lane, not just a dashboard
- gameplay state can feed a public-facing dashboard directly
- the existing deploy pattern still works for a Node realtime service

## Tester handoff for Jazzclub

When the deploy is live, send Jazzclub something like this:

- open `/projects/peg-tanker-command/`
- enter a captain name and pick any faction
- move with W/S and steer with A/D
- touch the centre depot to load cargo, then return to your faction harbour
- watch for AI drones diving in
- confirm the public dashboard changes when deliveries, hits, and losses happen
- report any desync, rubber-banding, dead controls, or obvious score weirdness
