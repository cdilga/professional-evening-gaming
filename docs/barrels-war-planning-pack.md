# Barrels War Planning Pack

## Purpose

This document turns the current PEG direction into an executable game plan for a live multiplayer tanker game that can ship as a deployable PEG project lane, integrate with the existing live-lobby and session-hub patterns, and leave room for a later Rust/WASM gameplay engine.

Working title used here: **Barrels War**.

## Product vision

Barrels War is a live shared-war experience for mobile and desktop where players join a session, pick a fictional faction, and pilot vulnerable tanker vehicles across a contested map. Tankers do **not** shoot. Instead, the threat layer comes from AI drones that attack with readable, high-arc, slingshot-like motion that feels punchy and playful rather than mil-sim. Match results, world-state events, and session outcomes feed back into the public PEG dashboard/project surface so the game feels alive even outside active play.

## Non-negotiable design constraints

- Live online lobby must reuse PEG websocket/API service patterns already proven in repo.
- Mobile and desktop must both be first-class control surfaces.
- Players pick a fictional side/faction before entering the active session.
- Tankers cannot directly attack.
- AI drones provide primary combat pressure.
- Drone attacks should feel closer to Angry Birds style trajectory pressure than hitscan combat.
- Shared war map must matter beyond one isolated match.
- Scores, sessions, and state transitions need persistence.
- In-game events must affect the dashboard/public project surface.
- Project must fit PEG's deployable project-lane model.
- Future Rust/WASM migration must be optional, not required for MVP.

## Repo fit and architectural intent

### Existing PEG patterns we should build on

- `projects/peg-live-lobby/` gives us the realtime room-state and websocket reference lane.
- `projects/peg-session-hub/` gives us the FastAPI + Postgres + migrations + deploy contract reference lane.
- `docs/platform-architecture.md` already defines PEG as a shared control plane with self-contained project lanes and optional shared Postgres schemas.

### Recommendation

Create a new service-backed project lane, likely:

- `projects/barrels-war/`

Recommended shape for first delivery:

- **frontend client**: lightweight web client, mobile-first responsive, likely plain TS/Vite or React if needed
- **realtime service**: Node/Fastify websocket service derived from `peg-live-lobby`
- **state API**: either same Node service for MVP or split API later
- **database**: PostgreSQL shared cluster with dedicated schemas
- **public surface integration**: static PEG project page plus a summary API or generated public JSON snapshot

### Suggested schema split

- `matchmaking` or `barrels_war_matchmaking`
- `scoreboards` or `barrels_war_scores`
- `playtests` or `barrels_war_sessions`
- optional later: `barrels_war_world`

For MVP, one schema is simpler:

- `barrels_war`

Then separate internally by tables.

## Experience pillars

1. **Readable live tension**
   - Players understand danger quickly.
   - Drone behavior is telegraphed enough to dodge.
   - Spectators can tell what is happening from public surfaces.

2. **Asymmetric vulnerability**
   - Tankers are slow, consequential, and non-offensive.
   - Success comes from routing, timing, teamwork, and event play.

3. **Shared-war persistence**
   - Individual sessions matter to a larger war map.
   - Public dashboard shows ongoing faction momentum.

4. **Short-session accessibility**
   - Sessions should be joinable from phone or desktop with minimal setup.
   - Good target for lunch-break or evening playtests.

5. **Deployable PEG artifact**
   - The lane must look good on the public project index.
   - Health, deploy, and observability should match existing repo standards.

## Core game loop

1. Player opens project page from PEG site.
2. Player enters or creates a live session.
3. Player picks a faction.
4. Lobby shows faction balance, connected players, ready state, and map/mode summary.
5. Match starts when readiness and server conditions are met.
6. Players drive tankers to complete route or territory objectives while avoiding drone attacks and environmental hazards.
7. AI drones select targets, launch arcing attacks, and pressure movement lanes.
8. Match produces score, faction contribution, notable events, and war-map deltas.
9. Session summary updates:
   - player/team scoreboards
   - war-map state
   - public project dashboard/event feed
10. Players requeue, switch faction, spectate, or review war impact.

## MVP scope

### MVP goal

Ship a playable online prototype that proves the full product loop:

- lobby -> faction select -> short live match -> AI drone attacks -> scoreboard -> persistent war update -> public dashboard reflection

### MVP gameplay scope

- 1 shared map
- 2 fictional factions
- 1 tanker class
- 1 drone archetype
- 1 core objective mode
- 4 to 12 players target, with graceful degradation for fewer
- 3 to 5 minute round length
- simple top-down or lightly angled 2D presentation
- server-authoritative match resolution for score and world updates

### MVP feature list

#### Client
- responsive login/join screen without full account system
- nickname + session identity token
- faction selection UI
- lobby screen with readiness
- simple match HUD
- touch and keyboard controls
- match-end summary

#### Realtime service
- room/session creation and join
- presence and ready state
- websocket event broadcast
- simple match lifecycle state machine
- authoritative drone spawn and event sequencing
- anti-duplication handling for reconnects

#### Persistence
- sessions
- players
- matches
- faction results
- war-map region state summary
- event feed entries for public dashboard

#### Public/project surface
- project card/status on PEG site
- dedicated project page showing:
  - current faction momentum
  - latest completed matches
  - notable drone incidents
  - active session count or recent session count

#### Operations
- health endpoint
- deploy workflow
- basic test coverage
- seed/dev mode

## v1 scope

v1 should deepen retention and clarity rather than radically expanding engine complexity.

- multiple maps or sectors
- 2 to 3 objective modes
- multiple drone archetypes
- better faction progression
- richer public war dashboard
- reconnect recovery
- spectator mode
- abuse controls and moderation basics
- analytics and balancing instrumentation

## Later scope

- Rust/WASM gameplay simulation or physics-heavy subsystems
- more advanced pathing and projectile curves
- map editor/tooling
- seasonal campaigns
- bots for missing players
- replay system
- richer guild/faction social layer
- native wrapper or installable PWA

## Recommended technical architecture

## 1. Project lane layout

Recommended initial structure:

```text
projects/barrels-war/
  README.md
  peg-project.json
  app/                  # frontend client
  service/              # Node/Fastify realtime API for MVP
  infra/
  docs/
```

Alternative if frontend stays static-only for first milestone:

```text
projects/barrels-war/
  client/
  api/
  infra/
```

## 2. Service boundaries

### Option A, recommended for MVP: one Node service

Use one Fastify service handling:

- websocket rooms
- HTTP APIs
- match orchestration
- public summary endpoints
- DB writes

Why this is best now:

- closest fit to existing `peg-live-lobby`
- fewer moving pieces
- faster to deploy
- easier realtime/game-loop iteration

### Option B, recommended for later: split control plane and simulation

- Node/Fastify gateway for lobby/API/websocket fanout
- Rust/WASM or Rust service for simulation-heavy match logic
- Postgres for durable state
- Redis later if ephemeral room/event scale demands it

## 3. Data ownership

### Durable state

Use Postgres for:

- player identities
- sessions and room metadata
- matches and results
- faction and war-map aggregate state
- public event feed

### Ephemeral state

Keep in process for MVP:

- active room connections
- current match phase
- transient drone attack timelines
- last-known input timestamps

Persist snapshots on phase changes and match completion.

## 4. Public dashboard integration

This is essential, not optional.

Recommended contract:

- service publishes `GET /v1/public/summary`
- service publishes `GET /v1/public/events`
- PEG site project page consumes those endpoints directly
- `scripts/build-site.mjs` continues treating the lane like a normal PEG project

Possible data shown on project card/page:

- live war status
- current winning faction
- recent match count
- current active sessions
- last major event

## 5. Gameplay model recommendation

### Camera and map

For MVP, use a simple 2D overhead map with clearly marked lanes, obstacles, and region checkpoints.

### Tanker movement

- weighty acceleration
- turning penalty under speed
- no weapons
- maybe one non-damaging defensive mechanic later, but not in MVP unless required

### Drone threat model

Drone attacks should be:

- highly visible
- telegraphed
- arc-based
- avoidable with good movement
- deterministic enough to balance

MVP implementation idea:

- drones choose target zone or tanker
- pre-attack marker appears
- drone payload follows a bezier/parabolic arc with impact timing
- impact causes damage, slow, spill, or route denial

This creates the desired slingshot feel without needing full rigid-body physics in MVP.

## 6. Networking model

### Recommendation

Use a **server-authoritative event/tick-lite model**.

Do not attempt full peer-to-peer or physics-heavy client authority.

Server owns:

- room state
- match state transitions
- drone spawn timing
- authoritative health/objective updates
- final score calculation
- war-map deltas

Client owns:

- input intents
- local interpolation/animation
- prediction only where cosmetic

### Reasoning

- easier anti-cheat and fairness
- easier public-state synchronization
- simpler reconnect semantics
- better fit for persistent shared-war output

## 7. Rust/WASM migration strategy

Do not block MVP on Rust.

### MVP engine contract

Define gameplay logic behind clear interfaces now:

- drone attack generation
- movement validation
- match scoring
- world-state mutation

If these are written as isolated modules with test fixtures, later replacement becomes realistic.

### Candidate future Rust/WASM targets

- deterministic projectile/arc simulation
- AI drone target selection and pathing
- collision-heavy routines
- shared simulation module usable on server and maybe client replay/viewer

## Fictional world and faction framing

The factions should feel playful, distinctive, and non-real-world.

### Faction design rules

- no direct real-world geopolitical mirroring
- tone can be dramatic but slightly stylized
- clear visual separation for mobile readability

### Placeholder faction pair

- **The Brass Current**: disciplined logistics bloc, convoy doctrine, structured routes
- **The Ash Relay**: improvisational salvage confederacy, opportunistic routing, scrappy resilience

These names are placeholders, but planning assumes two factions with different flavor, not different core power balance for MVP.

## Shared war map model

## MVP war map

- 1 strategic map
- 5 to 9 named regions/sectors
- each completed match awards faction influence to a region
- map updates after every valid match result

### World-state loop

- sessions are associated to a sector
- match outcome yields influence points
- region control is updated
- public event feed announces swings, streaks, and contested zones

### Why this matters

It connects short rounds to persistent meaning and gives the public site something interesting to show between live sessions.

## Scoring and session management

### Session management needs

- create/join session
- track room code or slug
- ready/unready
- faction locked before match start
- reconnect within grace window
- end-of-match cleanup

### Scoring needs

MVP score dimensions:

- survival duration
- route/objective completion
- cargo delivered or checkpoint progress
- team completion bonus
- drone damage avoided could stay implicit, not surfaced directly yet

### Public score outputs

- per-match team winner
- player contribution summary
- faction war-map delta
- rolling leaderboard, daily or weekly if cheap

## UX and control strategy

### Mobile-first requirements

- thumb-reachable movement controls
- high-contrast attack telegraphs
- large enough faction and lobby touch targets
- low text density during match

### Desktop requirements

- WASD/arrow movement
- mouse/touch-friendly menus
- same HUD model as mobile where possible

### Accessibility priorities

- color is not the only faction distinguisher
- motion reduction option for intense attack arcs and camera shake
- readable text at small widths
- clear reconnect and state-loss messaging

## Public project surface requirements

The public PEG surface should show that this is a living project, not just a static game link.

### Minimum public features

- `peg-project.json` entry
- project page with art, summary, and CTA
- recent events module
- current faction-control snapshot
- current build/deploy status note if useful

### Nice-to-have public features

- embeddable live map card on main PEG homepage
- rotating highlight clips or screenshots
- playtest schedule powered by Session Hub or compatible schema

## Testing strategy

## MVP test layers

### Unit

- score calculation
- drone attack scheduler
- faction/world delta rules
- session state machine

### Integration

- join lobby -> ready -> start match -> end match -> persist result
- public summary endpoint reflects latest match result
- reconnect within grace period retains player identity

### Manual playtest scripts

- 2-player mobile/desktop mixed session
- 6-player latency tolerance check
- repeated session cycling for memory leak checks
- dashboard reflection after live event

## Observability and ops

### MVP observability

- structured logs
- match lifecycle log events
- websocket connection counts
- room counts
- DB write failures
- health endpoint with DB and room summary

### Recommended admin/debug endpoints

Protected or dev-only:

- seed fake sessions
- force match end
- dump room state summary
- simulate faction swing

## Security and abuse posture

Even for a playful prototype, some controls matter.

### MVP controls

- nickname validation
- basic rate limiting on join and state-changing actions
- room/session TTL cleanup
- server-side faction-lock enforcement
- no trust in client score submissions

### v1 controls

- moderation tools
- suspicious reconnect/spam detection
- signed session tokens

## Delivery roadmap

## Milestone 0, discovery and definition

- lock game fantasy and MVP rules
- choose lane structure and stack
- define domain model and event vocabulary
- align public dashboard requirements

## Milestone 1, service foundation

- scaffold project lane
- clone/adapt live-lobby patterns
- add DB schema and migrations
- stand up session + faction lobby flows

## Milestone 2, vertical slice gameplay

- playable map
- tanker movement
- one drone attack loop
- authoritative match start/end
- score persistence

## Milestone 3, public war surface

- public summary endpoints
- project page integration
- event feed and war-map output

## Milestone 4, balance and hardening

- reconnect logic
- load and soak testing
- telemetry review
- deploy readiness
- first-tester readiness for @Jazzclub and feedback triage loop

## Risks and blockers

## Key risks

### 1. Scope inflation risk

The combination of realtime multiplayer, shared world state, AI attackers, and public dashboard coupling can balloon quickly.

Mitigation:

- enforce one-map, one-drone, one-mode MVP
- keep visuals simple until loop is fun
- avoid account systems early

### 2. Physics ambition risk

Trying to build truly rich projectile physics too early may stall shipping.

Mitigation:

- emulate slingshot feel with deterministic arcs and telegraphs first
- reserve full simulation upgrades for Rust/WASM phase

### 3. Mobile control risk

A fun desktop prototype can fail on phones.

Mitigation:

- mobile-first controls in first playable slice
- every playtest must include at least one phone user

### 4. Realtime persistence coupling risk

If room state, match state, and public-state writes are tightly coupled, failures can create mismatches.

Mitigation:

- separate ephemeral room state from durable outcome writes
- use explicit match-complete transaction boundary
- make public summary derivable from persisted tables

### 5. Public dashboard latency risk

If public surface depends only on push timing, it can drift from actual DB truth.

Mitigation:

- use API-backed summary endpoints from durable state
- treat event feed as append-only or recomputable

### 6. Balance clarity risk

If drones feel unfair or unreadable, the no-weapons tanker fantasy becomes frustrating.

Mitigation:

- prioritize telegraphing, cooldown windows, and readable target selection
- tune for fairness over spectacle first

## Likely blockers

- no existing `barrels-war` lane scaffold yet
- no existing world-state schema yet
- no chosen rendering/UI stack for game client yet
- no agreed event contract between game service and public dashboard yet
- unclear whether session scheduling should integrate directly with Session Hub or stay separate in MVP

## Recommended decisions to force early

1. Use one Node/Fastify service for MVP, yes or no.
2. Use one Postgres schema `barrels_war`, yes or no.
3. Use one web client stack now, likely Vite + TS, yes or no.
4. Keep first game presentation 2D top-down, yes or no.
5. Public dashboard powered by API endpoints rather than static build snapshots, yes or no.

## Parallel workstream split

### Workstream A, product and game design

Owns:
- rules
- map/objectives
- faction framing
- balancing assumptions
- UX flows

Best subagent profile:
- design-heavy planner with systems sense

### Workstream B, service and data backbone

Owns:
- room state
- websocket events
- DB schema
- match lifecycle
- summary endpoints

Best subagent profile:
- backend/realtime engineer

### Workstream C, client and controls

Owns:
- responsive shell
- input model
- rendering/HUD
- lobby and match UI

Best subagent profile:
- frontend/gameplay engineer with mobile instincts

### Workstream D, public PEG integration

Owns:
- `peg-project.json`
- project page
- dashboard widgets
- event-feed visualization
- deploy lane alignment

Best subagent profile:
- product frontend + platform integrator

### Workstream E, delivery and QA

Owns:
- test plans
- playtest scripts
- deploy checks
- soak/load validation
- risk tracking

Best subagent profile:
- QA/devops hybrid

## Recommended execution order

1. Product rules and service contract freeze
2. Lane scaffold and schema bootstrap
3. Lobby/faction/session vertical slice
4. Movement + drone threat prototype
5. Match result persistence
6. Public summary/event endpoint integration
7. War-map rendering on project page
8. Reconnect, moderation basics, and hardening
9. Balance passes and scale tests

## Definition of success

MVP is successful when:

- players on phone and desktop can join the same room
- they can choose factions and start a match
- tankers can complete a short objective while AI drones attack with readable arcing pressure
- match outcomes update persistent score/world state
- the PEG public project surface visibly reflects those outcomes
- the lane deploys through the repo's normal private-service pattern without special-case ops

## First-tester readiness, @Jazzclub

@Jazzclub is the planned first external tester, so readiness for that session should be treated as a milestone rather than an afterthought.

### First-tester checklist

Before inviting @Jazzclub:

- stable URL is deployed and tested on one phone-sized viewport and one desktop viewport
- join flow works without manual operator fixes
- controls are explained in a short pre-match quickstart
- one full internal match has completed successfully on the same build
- reconnect behavior has been intentionally tested once
- scoreboard and public project-page reflection both work
- note-taking owner and triage destination are ready

### Feedback capture loop

During the session, capture:

- device and browser
- time-to-understand controls
- first confusion point
- first fun moment
- any unfair-feeling drone impact
- any disconnect, lag, or stale-state issue
- whether dashboard/public-page payoff felt meaningful

After the session:

- convert notes into blocker, bug, UX, balance, or nice-to-have buckets
- update the backlog and risk register within 24 hours
- prioritize the top 3 fixes before inviting broader testers

## Immediate next steps

1. Create `projects/barrels-war/` lane contract and README.
2. Draft schema and API event vocabulary.
3. Build lobby/faction flow from `peg-live-lobby` base.
4. Build a fake-data public summary endpoint and project page stub early.
5. Prepare the @Jazzclub first-tester checklist and feedback capture template before wider playtesting.
6. Only then start broad gameplay slice implementation.
