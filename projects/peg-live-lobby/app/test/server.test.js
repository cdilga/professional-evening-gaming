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

  await app.close();
});

test("ready endpoint adds players and increments ready count", async () => {
  const app = buildApp({ statePath: tmpStatePath() });
  const before = (await app.inject({ method: "GET", url: "/v1/lobby" })).json();
  const response = await app.inject({
    method: "POST",
    url: "/v1/lobby/ready",
    payload: { player: "sassy-sasquatch" },
  });
  const payload = response.json();

  assert.equal(response.statusCode, 200);
  assert.equal(payload.state.readyCount, before.state.readyCount + 1);
  assert.ok(payload.state.players.includes("sassy-sasquatch"));

  await app.close();
});

test("state persists across app restarts", async () => {
  const statePath = tmpStatePath();

  // First instance: mutate state
  const app1 = buildApp({ statePath });
  await app1.inject({
    method: "POST",
    url: "/v1/lobby/ready",
    payload: { player: "persist-test-player" },
  });
  const snapshot1 = (await app1.inject({ method: "GET", url: "/v1/lobby" })).json();
  await app1.close();

  // Second instance: verify state survived
  const app2 = buildApp({ statePath });
  const snapshot2 = (await app2.inject({ method: "GET", url: "/v1/lobby" })).json();

  assert.equal(snapshot2.state.readyCount, snapshot1.state.readyCount);
  assert.ok(snapshot2.state.players.includes("persist-test-player"));

  await app2.close();
});
