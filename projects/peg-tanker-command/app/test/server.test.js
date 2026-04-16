import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import { buildApp } from "../src/server.js";
import { FACTIONS } from "../src/game.js";

function tmpStatePath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tanker-command-test-"));
  return path.join(dir, "state.json");
}

test("health endpoint reports tanker command service", async () => {
  const app = await buildApp({ statePath: tmpStatePath(), startLoop: false });
  const response = await app.inject({ method: "GET", url: "/health" });
  const payload = response.json();

  assert.equal(response.statusCode, 200);
  assert.equal(payload.service, "peg-tanker-command");
  assert.equal(payload.connectedClients, 0);

  await app.close();
});

test("join creates player and tanker on valid faction", async () => {
  const app = await buildApp({ statePath: tmpStatePath(), startLoop: false });
  const response = await app.inject({
    method: "POST",
    url: "/v1/game/join",
    payload: { name: "Jazzclub", faction_id: FACTIONS[0].id },
  });
  const payload = response.json();

  assert.equal(response.statusCode, 200);
  assert.equal(payload.player.name, "Jazzclub");
  assert.equal(payload.player.factionId, FACTIONS[0].id);
  assert.equal(payload.state.players.length, 1);
  assert.equal(payload.state.tankers.length, 1);

  await app.close();
});

test("join accepts player as a legacy name alias", async () => {
  const app = await buildApp({ statePath: tmpStatePath(), startLoop: false });
  const response = await app.inject({
    method: "POST",
    url: "/v1/game/join",
    payload: { player: "CodexProbe", faction_id: FACTIONS[0].id },
  });
  const payload = response.json();

  assert.equal(response.statusCode, 200);
  assert.equal(payload.player.name, "CodexProbe");

  await app.close();
});

test("join rejects invalid faction", async () => {
  const app = await buildApp({ statePath: tmpStatePath(), startLoop: false });
  const response = await app.inject({
    method: "POST",
    url: "/v1/game/join",
    payload: { name: "Nope", faction_id: "real-country" },
  });

  assert.ok(response.json().error);
  await app.close();
});

test("game tick produces dashboard payload", async () => {
  const app = await buildApp({ statePath: tmpStatePath(), startLoop: false, enableTestRoutes: true });
  await app.inject({
    method: "POST",
    url: "/v1/game/join",
    payload: { name: "Skipper", faction_id: FACTIONS[1].id },
  });

  await app.inject({ method: "POST", url: "/v1/game/tick", payload: { deltaMs: 3000 } });
  const dashboard = await app.inject({ method: "GET", url: "/v1/dashboard" });
  const payload = dashboard.json().dashboard;

  assert.ok(Array.isArray(payload.factionControl));
  assert.ok(Array.isArray(payload.leaderboard));
  assert.equal(typeof payload.activeTankers, "number");

  await app.close();
});

test("player input updates tanker controls", async () => {
  const app = await buildApp({ statePath: tmpStatePath(), startLoop: false });
  const join = await app.inject({
    method: "POST",
    url: "/v1/game/join",
    payload: { name: "Helm", faction_id: FACTIONS[2].id },
  });
  const playerId = join.json().player.id;

  const response = await app.inject({
    method: "POST",
    url: "/v1/game/input",
    payload: { player_id: playerId, thrust: 1, turn: -1 },
  });

  assert.equal(response.json().ok, true);
  assert.equal(app.tankerState.tankers[0].controls.thrust, 1);
  assert.equal(app.tankerState.tankers[0].controls.turn, -1);

  await app.close();
});

test("player input stays live-only and does not advance durable revision", async () => {
  const app = await buildApp({ statePath: tmpStatePath(), startLoop: false, enableTestRoutes: true });
  const join = await app.inject({
    method: "POST",
    url: "/v1/game/join",
    payload: { name: "SoftWake", faction_id: FACTIONS[0].id },
  });
  const playerId = join.json().player.id;
  const revisionAfterJoin = app.tankerState.meta.revision;

  await app.inject({
    method: "POST",
    url: "/v1/game/input",
    payload: { player_id: playerId, thrust: 1, turn: 1 },
  });
  await app.inject({ method: "POST", url: "/v1/game/tick", payload: { deltaMs: 100 } });

  assert.equal(app.tankerState.meta.revision, revisionAfterJoin);

  await app.close();
});

test("state persists across restart", async () => {
  const statePath = tmpStatePath();

  const app1 = await buildApp({ statePath, startLoop: false });
  await app1.inject({
    method: "POST",
    url: "/v1/game/join",
    payload: { name: "Persisto", faction_id: FACTIONS[3].id },
  });
  await app1.close();

  const app2 = await buildApp({ statePath, startLoop: false });
  const response = await app2.inject({ method: "GET", url: "/v1/game" });
  const payload = response.json().state;

  assert.equal(payload.players.length, 1);
  assert.equal(payload.players[0].name, "Persisto");

  await app2.close();
});

test("persisted state strips live revision counters from disk", async () => {
  const statePath = tmpStatePath();
  const app = await buildApp({ statePath, startLoop: false });

  await app.inject({
    method: "POST",
    url: "/v1/game/join",
    payload: { name: "Checkpoint", faction_id: FACTIONS[1].id },
  });

  assert.equal(app.tankerState.meta.revision, 1);

  const saved = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.equal(saved.meta.revision, 0);

  await app.close();
});

test("websocket route responds to ping", async () => {
  const app = await buildApp({ statePath: tmpStatePath(), startLoop: false });
  await app.ready();

  const socket = await app.injectWS("/ws");
  const message = await new Promise((resolve, reject) => {
    socket.send(JSON.stringify({ type: "ping" }));
    socket.once("message", (raw) => resolve(JSON.parse(raw.toString())));
    socket.once("error", reject);
    setTimeout(() => reject(new Error("websocket pong timeout")), 2000);
  });

  assert.equal(message.type, "pong");
  assert.ok(message.state);
  assert.ok(message.dashboard);

  socket.close();
  await app.close();
});
