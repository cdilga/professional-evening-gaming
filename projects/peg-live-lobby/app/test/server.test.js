import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import { buildApp } from "../src/server.js";

function tmpStatePath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lobby-test-"));
  return path.join(dir, "state.json");
}

test("health endpoint reports lobby service", async () => {
  const app = buildApp({ statePath: tmpStatePath() });
  const response = await app.inject({ method: "GET", url: "/health" });
  const payload = response.json();

  assert.equal(response.statusCode, 200);
  assert.equal(payload.service, "peg-live-lobby");
  assert.equal(payload.connectedClients, 0);

  await app.close();
});

test("new state starts with empty players", async () => {
  const app = buildApp({ statePath: tmpStatePath() });
  const response = await app.inject({ method: "GET", url: "/v1/lobby" });
  const payload = response.json();

  assert.deepEqual(payload.state.players, []);
  assert.equal(payload.state.readyCount, 0);
  assert.equal(payload.state.totalPlayers, 0);
  assert.equal(payload.state.allReady, false);

  await app.close();
});

test("ready endpoint adds player as ready", async () => {
  const app = buildApp({ statePath: tmpStatePath() });
  const response = await app.inject({
    method: "POST",
    url: "/v1/lobby/ready",
    payload: { player: "sassy-sasquatch" },
  });
  const payload = response.json();

  assert.equal(response.statusCode, 200);
  assert.equal(payload.state.totalPlayers, 1);
  assert.equal(payload.state.readyCount, 1);
  assert.equal(payload.state.players[0].name, "sassy-sasquatch");
  assert.equal(payload.state.players[0].ready, true);

  await app.close();
});

test("ready toggles existing player between ready and not ready", async () => {
  const app = buildApp({ statePath: tmpStatePath() });

  await app.inject({
    method: "POST",
    url: "/v1/lobby/ready",
    payload: { player: "toggler" },
  });

  const response = await app.inject({
    method: "POST",
    url: "/v1/lobby/ready",
    payload: { player: "toggler" },
  });
  const payload = response.json();

  assert.equal(payload.state.totalPlayers, 1);
  assert.equal(payload.state.readyCount, 0);
  assert.equal(payload.state.players[0].ready, false);

  const response2 = await app.inject({
    method: "POST",
    url: "/v1/lobby/ready",
    payload: { player: "toggler" },
  });
  assert.equal(response2.json().state.readyCount, 1);

  await app.close();
});

test("allReady is true when all players are ready", async () => {
  const app = buildApp({ statePath: tmpStatePath() });

  await app.inject({ method: "POST", url: "/v1/lobby/ready", payload: { player: "alice" } });
  await app.inject({ method: "POST", url: "/v1/lobby/ready", payload: { player: "bob" } });

  const response = await app.inject({ method: "GET", url: "/v1/lobby" });
  const payload = response.json();

  assert.equal(payload.state.allReady, true);

  await app.inject({ method: "POST", url: "/v1/lobby/ready", payload: { player: "alice" } });
  const response2 = await app.inject({ method: "GET", url: "/v1/lobby" });
  assert.equal(response2.json().state.allReady, false);

  await app.close();
});

test("state persists across app restarts", async () => {
  const statePath = tmpStatePath();

  const app1 = buildApp({ statePath });
  await app1.inject({
    method: "POST",
    url: "/v1/lobby/ready",
    payload: { player: "persist-test-player" },
  });
  await app1.close();

  const app2 = buildApp({ statePath });
  const snapshot2 = (await app2.inject({ method: "GET", url: "/v1/lobby" })).json();

  assert.equal(snapshot2.state.totalPlayers, 1);
  assert.equal(snapshot2.state.players[0].name, "persist-test-player");

  await app2.close();
});

test("migrates old string[] player format on load", async () => {
  const statePath = tmpStatePath();
  const dir = path.dirname(statePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify({
    room: "main-lobby",
    players: ["old-alice", "old-bob"],
    readyCount: 2,
    updatedAt: "2025-01-01T00:00:00.000Z",
  }));

  const app = buildApp({ statePath });
  const response = await app.inject({ method: "GET", url: "/v1/lobby" });
  const payload = response.json();

  assert.equal(payload.state.totalPlayers, 2);
  assert.equal(payload.state.players[0].name, "old-alice");
  assert.equal(payload.state.players[0].ready, false);

  await app.close();
});

test("missing player name returns error", async () => {
  const app = buildApp({ statePath: tmpStatePath() });
  const response = await app.inject({
    method: "POST",
    url: "/v1/lobby/ready",
    payload: {},
  });

  assert.ok(response.json().error);

  await app.close();
});

test("session_id scopes player ready state", async () => {
  const app = buildApp({ statePath: tmpStatePath() });

  await app.inject({
    method: "POST",
    url: "/v1/lobby/ready",
    payload: { player: "alice", session_id: "1" },
  });
  await app.inject({
    method: "POST",
    url: "/v1/lobby/ready",
    payload: { player: "bob", session_id: "2" },
  });
  await app.inject({
    method: "POST",
    url: "/v1/lobby/ready",
    payload: { player: "cass" },
  });

  // Filter by session 1
  const r1 = await app.inject({ method: "GET", url: "/v1/lobby?session_id=1" });
  const s1 = r1.json().state;
  assert.equal(s1.totalPlayers, 1);
  assert.equal(s1.players[0].name, "alice");

  // Filter by session 2
  const r2 = await app.inject({ method: "GET", url: "/v1/lobby?session_id=2" });
  assert.equal(r2.json().state.totalPlayers, 1);

  // No filter shows all
  const rAll = await app.inject({ method: "GET", url: "/v1/lobby" });
  assert.equal(rAll.json().state.totalPlayers, 3);

  await app.close();
});

test("same player can ready for different sessions", async () => {
  const app = buildApp({ statePath: tmpStatePath() });

  await app.inject({
    method: "POST",
    url: "/v1/lobby/ready",
    payload: { player: "alice", session_id: "1" },
  });
  await app.inject({
    method: "POST",
    url: "/v1/lobby/ready",
    payload: { player: "alice", session_id: "2" },
  });

  const response = await app.inject({ method: "GET", url: "/v1/lobby" });
  const state = response.json().state;

  assert.equal(state.totalPlayers, 2);
  assert.equal(state.players[0].sessionId, "1");
  assert.equal(state.players[1].sessionId, "2");

  await app.close();
});
