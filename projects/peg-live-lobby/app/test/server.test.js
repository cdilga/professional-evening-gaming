import test from "node:test";
import assert from "node:assert/strict";

import { buildApp } from "../src/server.js";

test("health endpoint reports lobby service", async () => {
  const app = buildApp();
  const response = await app.inject({ method: "GET", url: "/health" });
  const payload = response.json();

  assert.equal(response.statusCode, 200);
  assert.equal(payload.service, "peg-live-lobby");

  await app.close();
});

test("ready endpoint adds players and increments ready count", async () => {
  const app = buildApp();
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
