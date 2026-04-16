# Barrels War Backlog

## Planning intent

This backlog turns the Barrels War direction into executable PEG work with epics, milestones, granular tasks, dependencies, acceptance criteria, and a recommended run order.

Primary reference:

- `docs/barrels-war-planning-pack.md`

## Delivery lanes at a glance

- **MVP**: prove the full loop, lobby to public dashboard impact
- **v1**: deepen reliability, replayability, and social clarity
- **Later**: simulation/engine upgrades and broader world systems

## Milestones

### M0, product definition and technical framing
Lock the rules, architecture, and delivery contract.

### M1, project lane and backend spine
Create the PEG lane, DB schema, websocket/API foundations, and deploy path.

### M2, first playable vertical slice
Players can join, pick factions, move tankers, face drones, and finish a short match.

### M3, persistent war state and public surface
Match results alter persistent state and visibly show up on the PEG public project surface.

### M4, first-tester readiness and playtest loop
Make the build safe and clear enough for @Jazzclub as first external tester.

### M5, MVP hardening and deploy-ready lane
Stabilize, add tests, operational checks, and make the lane safe to iterate live.

### M6, v1 expansion
More content, better reconnect/spectator support, improved progression, balancing, and analytics.

---

# Epic A, Product definition and game rules

## A1. Lock MVP fantasy and player promises

### A1.1 Write product one-pager
- Depends on: none
- Acceptance criteria:
  - states game fantasy, target session length, core objective, player fantasy, and why tankers cannot shoot
  - states why drones are the primary threat
  - stored in repo docs

### A1.2 Define MVP player loop
- Depends on: A1.1
- Acceptance criteria:
  - written step-by-step from join to match summary
  - identifies every required state transition

### A1.3 Define mode rules for first map
- Depends on: A1.2
- Acceptance criteria:
  - objective, win condition, fail condition, time cap, and scoring inputs are explicit
  - one single mode only for MVP

### A1.4 Define faction framing and naming pass
- Depends on: A1.1
- Acceptance criteria:
  - two fictional factions named and described
  - visual identity notes captured
  - no real-world political mirroring

### A1.5 Define drone archetype 01
- Depends on: A1.3
- Acceptance criteria:
  - target selection rule, telegraph, arc feel, damage/effect, cadence, and readability constraints documented

## A2. UX and control definition

### A2.1 Write mobile control spec
- Depends on: A1.2
- Acceptance criteria:
  - thumb-control layout documented
  - fallback desktop mapping documented
  - accessibility notes included

### A2.2 Write HUD/state UX spec
- Depends on: A1.2
- Acceptance criteria:
  - lobby, faction select, match, reconnect, and summary screens documented
  - minimum required HUD elements listed

### A2.3 Define spectator/public-view requirements
- Depends on: A2.2
- Acceptance criteria:
  - identifies what non-players see on project page vs in live client

---

# Epic B, Architecture and lane scaffolding

## B1. Create project lane

### B1.1 Create `projects/barrels-war/` scaffold
- Depends on: A1.1
- Acceptance criteria:
  - README exists
  - `peg-project.json` exists
  - app/service/infra/docs structure established or an explicitly chosen variant

### B1.2 Define lane contract for public site
- Depends on: B1.1
- Acceptance criteria:
  - project metadata includes summary, status, links, stack, deployment contract
  - build-site script can discover it without hacks

### B1.3 Add lane docs index
- Depends on: B1.1
- Acceptance criteria:
  - lane README points to plan, backlog, runbook, and API docs

## B2. Service architecture

### B2.1 Decide MVP stack boundary
- Depends on: A1.2, B1.1
- Acceptance criteria:
  - explicit choice recorded: single Node service for MVP or split services
  - reasons documented

### B2.2 Define websocket event vocabulary
- Depends on: B2.1
- Acceptance criteria:
  - join, ready, faction-lock, match-start, state-update, drone-attack, damage, score, match-end, reconnect events specified
  - payload contracts listed

### B2.3 Define HTTP API surface
- Depends on: B2.1
- Acceptance criteria:
  - public endpoints and authenticated/player endpoints listed
  - health, summary, session, and match routes defined

### B2.4 Define authoritative game-loop model
- Depends on: B2.2
- Acceptance criteria:
  - tick or event cadence documented
  - authority boundaries between server and client documented

---

# Epic C, Data model and persistence

## C1. Database foundation

### C1.1 Choose schema approach
- Depends on: B2.1
- Acceptance criteria:
  - `barrels_war` schema decision recorded
  - shared-cluster assumption confirmed

### C1.2 Design MVP tables
- Depends on: C1.1, A1.3
- Acceptance criteria:
  - tables drafted for players, sessions, session_participants, matches, match_players, factions, regions, region_control, event_feed

### C1.3 Write initial migration
- Depends on: C1.2
- Acceptance criteria:
  - SQL migration created
  - can bootstrap schema in local/dev deploy

### C1.4 Define world-state derivation rules
- Depends on: C1.2, A1.3
- Acceptance criteria:
  - region control update algorithm documented
  - public summary can be computed from durable state

## C2. Persistence contracts

### C2.1 Define write boundaries
- Depends on: C1.4, B2.4
- Acceptance criteria:
  - clear rules for when ephemeral room state becomes durable match state
  - match-complete transaction boundary documented

### C2.2 Define idempotency/reconnect identity rules
- Depends on: C1.2, B2.2
- Acceptance criteria:
  - reconnect and duplicate join behavior documented
  - session identity token approach chosen for MVP

---

# Epic D, Realtime lobby and session flow

## D1. Lobby flow

### D1.1 Fork/adapt `peg-live-lobby` foundation
- Depends on: B2.1
- Acceptance criteria:
  - basic Fastify/websocket app starts under new lane
  - room state can be viewed over HTTP and websocket

### D1.2 Add session create/join flow
- Depends on: D1.1, C2.2
- Acceptance criteria:
  - users can create or join a room by code or slug
  - duplicate identities handled safely

### D1.3 Add ready/unready and faction pick
- Depends on: D1.2, A1.4
- Acceptance criteria:
  - players can select faction before match start
  - ready state visible to all participants
  - faction lock enforced on match start

### D1.4 Add lobby validation rules
- Depends on: D1.3
- Acceptance criteria:
  - minimum player rules documented and implemented
  - invalid state transitions rejected cleanly

## D2. Session lifecycle

### D2.1 Implement match lifecycle state machine
- Depends on: D1.4, B2.4
- Acceptance criteria:
  - phases at minimum: lobby, countdown, active, resolution, summary, closed

### D2.2 Implement reconnect grace window
- Depends on: D2.1, C2.2
- Acceptance criteria:
  - disconnect/reconnect within grace period restores same player slot and faction

### D2.3 Session cleanup and TTL rules
- Depends on: D2.1
- Acceptance criteria:
  - abandoned rooms expire safely
  - stale active sessions do not pollute public counts forever

---

# Epic E, Gameplay vertical slice

## E1. Movement and map

### E1.1 Build first map layout
- Depends on: A1.3
- Acceptance criteria:
  - one MVP map with routes, obstacles, checkpoints, and sector metadata

### E1.2 Implement tanker movement model
- Depends on: A2.1, E1.1
- Acceptance criteria:
  - tanker can move on mobile and desktop
  - acceleration/turning feel deliberately weighty
  - no offensive weapon system exists

### E1.3 Implement collision/bounds rules
- Depends on: E1.2
- Acceptance criteria:
  - players cannot leave intended playable area
  - obstacle interaction is predictable

## E2. Drone threat system

### E2.1 Build drone attack telegraph
- Depends on: A1.5
- Acceptance criteria:
  - attack wind-up is visible and readable on mobile

### E2.2 Implement first slingshot-style arc attack
- Depends on: E2.1, B2.4
- Acceptance criteria:
  - attack path feels like a readable lob, not hitscan
  - impact timing is deterministic enough to test

### E2.3 Implement hit/effect resolution
- Depends on: E2.2
- Acceptance criteria:
  - tanker damage or route penalty is applied server-authoritatively
  - client only renders confirmed outcomes or cosmetic prediction

### E2.4 Tune fairness pass for drone archetype 01
- Depends on: E2.3
- Acceptance criteria:
  - drone attacks are threatening but not arbitrary
  - telemetry or manual notes captured from playtests

## E3. Match objective and scoring

### E3.1 Implement objective progression
- Depends on: E1.1, E1.2
- Acceptance criteria:
  - players can progress toward one clearly measurable objective

### E3.2 Implement match win/loss logic
- Depends on: E3.1, E2.3
- Acceptance criteria:
  - end-of-match conditions fire reliably

### E3.3 Implement score calculation
- Depends on: E3.2
- Acceptance criteria:
  - score output includes faction/team winner and player contribution summary

### E3.4 Persist match result and world delta
- Depends on: E3.3, C2.1
- Acceptance criteria:
  - match result is written durably
  - world/region control update is applied exactly once

---

# Epic F, Client shell and UX

## F1. Pre-match UX

### F1.1 Build landing/join shell
- Depends on: B1.1
- Acceptance criteria:
  - players can enter nickname and join a room on mobile and desktop

### F1.2 Build faction selection screen
- Depends on: A1.4, D1.3
- Acceptance criteria:
  - factions are clearly distinct visually and textually

### F1.3 Build lobby roster/ready UI
- Depends on: D1.3
- Acceptance criteria:
  - roster, faction, ready state, and room status update live

## F2. In-match UX

### F2.1 Build HUD with essential state
- Depends on: A2.2, E1.2
- Acceptance criteria:
  - health/status, objective progress, timer, and threat indicators visible

### F2.2 Implement touch controls
- Depends on: A2.1, E1.2
- Acceptance criteria:
  - tested on an actual phone-sized viewport

### F2.3 Implement desktop controls
- Depends on: A2.1, E1.2
- Acceptance criteria:
  - keyboard controls feel responsive and documented

### F2.4 Build summary/requeue flow
- Depends on: E3.4
- Acceptance criteria:
  - players can review outcome and requeue or exit cleanly

---

# Epic G, Public PEG integration

## G1. Public data contracts

### G1.1 Build public summary endpoint
- Depends on: C1.4, E3.4
- Acceptance criteria:
  - endpoint returns current faction lead, region summary, recent match count, active or recent sessions

### G1.2 Build public events endpoint
- Depends on: E3.4
- Acceptance criteria:
  - endpoint returns latest world-impacting events in a clean format

### G1.3 Define stale-data behavior
- Depends on: G1.1
- Acceptance criteria:
  - project page behavior is documented when service is empty or offline

## G2. Public project page

### G2.1 Create project page content and visuals
- Depends on: B1.2, G1.1
- Acceptance criteria:
  - page explains the game, factions, and current war status

### G2.2 Render live war snapshot on project page
- Depends on: G1.1
- Acceptance criteria:
  - page updates from API without special build hacks

### G2.3 Render recent events module
- Depends on: G1.2
- Acceptance criteria:
  - major in-game events appear on project page and make sense to spectators

### G2.4 Optional homepage/project-card live status hook
- Depends on: G2.2
- Acceptance criteria:
  - main PEG surface can show at least one dynamic status item for the lane

---

# Epic H, Deploy, quality, and operations

## H1. Local and deploy foundation

### H1.1 Add Dockerfile and compose setup
- Depends on: B1.1, B2.1
- Acceptance criteria:
  - lane can run locally and via PEG private-service pattern

### H1.2 Add env examples and config docs
- Depends on: H1.1
- Acceptance criteria:
  - required env vars documented
  - no hidden runtime requirements

### H1.3 Add deploy workflow
- Depends on: H1.1
- Acceptance criteria:
  - GitHub workflow follows existing PEG pattern
  - health check included

## H2. Testing and validation

### H2.1 Add unit tests for score and world rules
- Depends on: E3.3, C1.4
- Acceptance criteria:
  - core scoring and world delta logic covered

### H2.2 Add integration tests for room lifecycle
- Depends on: D2.1, E3.4
- Acceptance criteria:
  - create/join/ready/start/end flow tested

### H2.3 Add integration test for public summary reflection
- Depends on: G1.1, E3.4
- Acceptance criteria:
  - completed match updates public endpoint output

### H2.4 Add smoke checks for deploy
- Depends on: H1.3
- Acceptance criteria:
  - health endpoint and one public summary endpoint are verified post-deploy

## H3. Observability

### H3.1 Add structured lifecycle logging
- Depends on: D2.1
- Acceptance criteria:
  - join, start, disconnect, end, and DB error paths log usefully

### H3.2 Add room/session metrics summary to health or debug endpoint
- Depends on: D2.3
- Acceptance criteria:
  - operationally useful counts exposed safely

---

# Epic I, First-tester readiness for @Jazzclub

## I1. First-tester checklist creation

### I1.1 Create first-tester readiness checklist doc section
- Depends on: F2.4, G2.3, H2.2
- Acceptance criteria:
  - checklist exists in planning docs
  - names @Jazzclub as first tester
  - covers access, controls clarity, session stability, and feedback collection

### I1.2 Define success criteria for first external test session
- Depends on: I1.1
- Acceptance criteria:
  - clear go/no-go conditions listed
  - target session length and expected outcomes documented

## I2. Build first-tester safe experience

### I2.1 Add tester-facing quickstart panel
- Depends on: F1.1, F2.1
- Acceptance criteria:
  - first-time player sees concise controls/objective help

### I2.2 Add graceful error/reconnect messaging
- Depends on: D2.2, F2.1
- Acceptance criteria:
  - disconnects and failures do not look like silent brokenness

### I2.3 Seed a known-good test room flow
- Depends on: D1.2, H1.1
- Acceptance criteria:
  - team can launch a predictable room for @Jazzclub without manual DB surgery

## I3. Feedback capture loop

### I3.1 Define playtest script for @Jazzclub session
- Depends on: I2.1
- Acceptance criteria:
  - script covers join, faction selection, one full match, requeue, and dashboard check

### I3.2 Create structured feedback template
- Depends on: I3.1
- Acceptance criteria:
  - captures device, browser, clarity, controls, fun, bugs, unfair moments, and confusion points

### I3.3 Add feedback ingestion destination
- Depends on: I3.2
- Acceptance criteria:
  - one agreed repo path, issue template, or notes file exists for test outcomes
  - owners for triage are clear

### I3.4 Add post-test triage loop
- Depends on: I3.3
- Acceptance criteria:
  - every test note becomes one of: bug, balance issue, UX issue, nice-to-have, blocker
  - turnaround expectation for top issues documented

---

# Epic J, MVP hardening

## J1. Stability and fairness

### J1.1 Soak test repeated session cycling
- Depends on: H2.2
- Acceptance criteria:
  - repeated create/join/end cycles do not leak obvious room state

### J1.2 Balance pass on drone cadence and damage
- Depends on: E2.4, I3.4
- Acceptance criteria:
  - top unfairness complaints addressed or consciously deferred

### J1.3 Tune onboarding friction
- Depends on: I3.4
- Acceptance criteria:
  - biggest first-minute confusion points reduced

## J2. MVP launch readiness

### J2.1 MVP go-live checklist
- Depends on: H2.4, J1.3
- Acceptance criteria:
  - deploy health, known limitations, rollback path, and tester notes documented

### J2.2 Public launch note on project page
- Depends on: G2.3, J2.1
- Acceptance criteria:
  - project page communicates playtest status honestly

---

# Epic K, v1 roadmap

### K1. Add second map or sector pack
- Depends on: MVP complete
- Acceptance criteria:
  - more than one strategic environment exists

### K2. Add second and third drone archetypes
- Depends on: MVP complete
- Acceptance criteria:
  - attack patterns materially differ and stay readable

### K3. Add spectator mode
- Depends on: MVP complete
- Acceptance criteria:
  - non-players can watch live match state usefully

### K4. Add richer faction progression
- Depends on: MVP complete
- Acceptance criteria:
  - players see persistent faction momentum beyond single-match wins

### K5. Add moderation and abuse controls
- Depends on: MVP complete
- Acceptance criteria:
  - bad nicknames/spam/reconnect abuse are manageable

### K6. Add analytics and balance dashboards
- Depends on: MVP complete
- Acceptance criteria:
  - design decisions can use actual telemetry

---

# Epic L, Later roadmap

### L1. Introduce Rust/WASM simulation module
- Depends on: stable interface contracts from MVP/v1
- Acceptance criteria:
  - at least one heavy gameplay subsystem can swap under existing contracts

### L2. Deterministic replay and event export
- Depends on: v1
- Acceptance criteria:
  - matches can be reviewed or highlighted

### L3. Campaign/season model
- Depends on: v1
- Acceptance criteria:
  - war state can reset or seasonally evolve cleanly

### L4. Tooling/editor support
- Depends on: v1
- Acceptance criteria:
  - map/event balancing becomes faster than hand-editing raw config

---

# Recommended execution order

## Phase 1, lock rules and contracts
1. A1.1
2. A1.2
3. A1.3
4. A1.5
5. A2.1
6. B2.1
7. B2.2
8. C1.1
9. C1.2

## Phase 2, establish lane and persistence spine
10. B1.1
11. B1.2
12. C1.3
13. C2.1
14. C2.2
15. D1.1
16. D1.2
17. D1.3
18. D2.1

## Phase 3, playable slice
19. E1.1
20. E1.2
21. F1.1
22. F1.2
23. F1.3
24. E2.1
25. E2.2
26. E2.3
27. E3.1
28. E3.2
29. E3.3
30. E3.4
31. F2.1
32. F2.2
33. F2.3
34. F2.4

## Phase 4, public surface and tester readiness
35. G1.1
36. G1.2
37. G2.1
38. G2.2
39. G2.3
40. I1.1
41. I1.2
42. I2.1
43. I2.2
44. I2.3
45. I3.1
46. I3.2
47. I3.3
48. I3.4

## Phase 5, harden and deploy
49. H1.1
50. H1.2
51. H1.3
52. H2.1
53. H2.2
54. H2.3
55. H2.4
56. H3.1
57. H3.2
58. J1.1
59. J1.2
60. J1.3
61. J2.1
62. J2.2

---

# Suggested parallel workstreams/subagents

## Stream 1, Game design and product rules
Best for a planning-heavy agent.

Owns:
- Epic A
- rule clarity support for Epic E
- tester script wording support for Epic I

## Stream 2, Realtime backend and persistence
Best for a backend/realtime engineer agent.

Owns:
- Epic B
- Epic C
- Epic D
- backend parts of E3, G1, H2, H3

## Stream 3, Client UX and gameplay shell
Best for a frontend/gameplay agent.

Owns:
- Epic E1 and E2 client-facing pieces
- Epic F
- tester quickstart in I2.1

## Stream 4, Public PEG integration and deploy lane
Best for a platform/frontend/devops agent.

Owns:
- Epic G
- Epic H1
- public status/docs parts of J2

## Stream 5, QA, playtesting, and feedback ops
Best for QA/ops/planning hybrid.

Owns:
- Epic I
- Epic H2 validation scripts
- Epic J hardening loop

Parallelism notes:
- Streams 1 and 2 should start first.
- Stream 3 can begin once event contracts and control assumptions stop moving every five minutes.
- Stream 4 can start once lane scaffold and public endpoint contracts exist.
- Stream 5 should begin before first playable, not after, so test instrumentation and feedback capture are baked in.

---

# First-tester readiness checklist for @Jazzclub

Use this before inviting @Jazzclub into the first real session.

## Access and setup
- build is deployed to a stable URL
- room join flow works without manual developer intervention
- test room can be pre-created or reliably created in under 30 seconds
- mobile browser support confirmed on at least one target device class
- desktop browser support confirmed on at least one target browser

## Clarity
- first screen explains objective in under 3 short bullets
- control hints are visible before match start
- faction choice is obvious and irreversible rules are explained
- attack telegraphs are readable without prior dev explanation

## Stability
- one full match completed locally or internally just before the external test
- reconnect flow tested once on purpose
- scoreboard and summary screen verified
- public project page reflects the session result

## Safety against looking broken
- empty/loading states present
- error states use human language
- disconnect state is visible and recoverable where possible
- known rough edges listed for facilitator so @Jazzclub is not gaslit by prototype jank

## Feedback readiness
- feedback template ready
- note-taking owner assigned
- triage destination prepared
- post-test debrief slot booked or expected same day

## Go/no-go rule
Do **not** invite @Jazzclub until all checklist items above are green or the remaining yellow items are explicitly accepted as non-blocking.

---

# Feedback capture loop for @Jazzclub

## During session
Capture:
- device and browser
- whether join flow was obvious
- whether controls made sense in under one minute
- first confusion moment
- first fun moment
- any unfair-feeling drone hit
- any reconnect or lag issue
- whether the public dashboard payoff felt meaningful

## After session
Classify every note as one of:
- blocker
- bug
- UX confusion
- balance issue
- content gap
- nice-to-have

## 24-hour follow-up target
Within 24 hours of the @Jazzclub session:
- convert notes into issues/tasks
- rank top 3 pain points
- decide fix now vs defer
- update the backlog and risk register
- log a short “what we learned” summary in repo docs or project notes

---

# Dependency hotspots

High-risk dependency chains to watch:

1. B2.2 -> D/E/F/G
   - If event contracts drift, everyone eats dirt.

2. C1/C2 -> E3/G1
   - If persistence shape is unclear, scoring and dashboard work will thrash.

3. E2 balance -> I/J
   - If drones are unreadable, first-tester feedback will be dominated by unfairness noise.

4. G1/G2 -> project credibility
   - If public surface does not reflect the match loop, a core product promise is broken.

---

# Definition of MVP done

MVP is done when:
- a new player can join on mobile or desktop
- they can pick a faction and start a short match with others
- tankers cannot shoot and still have a fun objective loop
- AI drones attack with readable slingshot-style pressure
- results persist to durable state
- the war map or equivalent regional control state updates
- the PEG public project surface reflects those updates
- @Jazzclub completes a first external test with captured feedback and no critical trust-breaking prototype failure
