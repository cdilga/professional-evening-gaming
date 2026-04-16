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
  const app = buildApp({ statePath: tmpStatePath(), startLoop: false });
  const response = await app.inject({ method: "GET", url: "/health" });
  const payload = response.json();

  assert.equal(response.statusCode, 200);
  assert.equal(payload.service, "peg-tanker-command");
  assert.equal(payload.connectedClients, 0);

  await app.close();
});

test("join creates player and tanker on valid faction", async () => {
  const app = buildApp({ statePath: tmpStatePath(), startLoop: false });
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

test("join rejects invalid faction", async () => {
  const app = buildApp({ statePath: tmpStatePath(), startLoop: false });
  const response = await app.inject({
    method: "POST",
    url: "/v1/game/join",
    payload: { name: "Nope", faction_id: "real-country" },
  });

  assert.ok(response.json().error);
  await app.close();
});

test("game tick produces dashboard payload", async () => {
  const app = buildApp({ statePath: tmpStatePath(), startLoop: false, enableTestRoutes: true });
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
  const app = buildApp({ statePath: tmpStatePath(), startLoop: false });
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

test("state persists across restart", async () => {
  const statePath = tmpStatePath();

  const app1 = buildApp({ statePath, startLoop: false });
  await app1.inject({
    method: "POST",
    url: "/v1/game/join",
    payload: { name: "Persisto", faction_id: FACTIONS[3].id },
  });
  await app1.close();

  const app2 = buildApp({ statePath, startLoop: false });
  const response = await app2.inject({ method: "GET", url: "/v1/game" });
  const payload = response.json().state;

  assert.equal(payload.players.length, 1);
  assert.equal(payload.players[0].name, "Persisto");

  await app2.close();
});
