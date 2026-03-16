import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Fastify from "fastify";
import websocket from "@fastify/websocket";

const DEFAULT_STATE_PATH = "/data/state.json";

function createState() {
  return {
    room: "main-lobby",
    players: ["astacus", "cass", "the lads"],
    readyCount: 1,
    updatedAt: new Date().toISOString(),
  };
}

function loadState(statePath) {
  try {
    const raw = fs.readFileSync(statePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return createState();
  }
}

function saveState(statePath, state) {
  const dir = path.dirname(statePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

export function buildApp(opts = {}) {
  const statePath = opts.statePath ?? process.env.STATE_PATH ?? DEFAULT_STATE_PATH;
  const app = Fastify({ logger: !opts.statePath });
  const state = loadState(statePath);

  app.register(websocket);

  app.get("/health", async () => ({
    status: "ok",
    service: "peg-live-lobby",
    room: state.room,
  }));

  app.get("/v1/lobby", async () => ({ state }));

  app.post("/v1/lobby/ready", async (request) => {
    const payload = request.body || {};
    if (payload.player && !state.players.includes(payload.player)) {
      state.players.push(payload.player);
    }
    state.readyCount += 1;
    state.updatedAt = new Date().toISOString();
    saveState(statePath, state);
    return { state };
  });

  app.get("/ws", { websocket: true }, (socket) => {
    socket.send(JSON.stringify({ type: "snapshot", state }));
    socket.on("message", (raw) => {
      try {
        const payload = JSON.parse(raw.toString());
        if (payload.type === "ping") {
          socket.send(JSON.stringify({ type: "pong", state }));
        }
      } catch {
        socket.send(JSON.stringify({ type: "error", message: "invalid json" }));
      }
    });
  });

  return app;
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  const app = buildApp();
  const port = Number(process.env.PORT || 3000);
  await app.listen({ host: "0.0.0.0", port });
}
