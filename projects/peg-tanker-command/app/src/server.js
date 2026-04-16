import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Fastify from "fastify";
import websocket from "@fastify/websocket";

import { applyPlayerInput, createGameState, getDashboard, getGameView, getHealthView, joinPlayer, stepGame } from "./game.js";

const DEFAULT_STATE_PATH = "/data/state.json";
const DEFAULT_TICK_MS = 100;

function loadState(statePath) {
  try {
    const raw = fs.readFileSync(statePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return createGameState();
  }
}

function saveState(statePath, state) {
  const dir = path.dirname(statePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

export async function buildApp(opts = {}) {
  const statePath = opts.statePath ?? process.env.STATE_PATH ?? DEFAULT_STATE_PATH;
  const tickMs = opts.tickMs ?? DEFAULT_TICK_MS;
  const startLoop = opts.startLoop ?? true;
  const app = Fastify({ logger: !opts.statePath });
  const state = loadState(statePath);
  const sockets = new Set();
  let interval = null;
  let dirty = false;

  function persist() {
    saveState(statePath, state);
    dirty = false;
  }

  function broadcast(type = "update") {
    const payload = JSON.stringify({ type, state: getGameView(state), dashboard: getDashboard(state) });
    for (const socket of sockets) {
      try {
        socket.send(payload);
      } catch {
        sockets.delete(socket);
      }
    }
  }

  function mutate(fn, { broadcastType = "update", persistAfter = true } = {}) {
    const result = fn();
    if (!result?.error) {
      dirty = true;
      if (persistAfter) {
        persist();
      }
      broadcast(broadcastType);
    }
    return result;
  }

  await app.register(websocket);

  app.get("/health", async () => getHealthView(state, sockets.size));

  app.get("/v1/game", async () => ({ state: getGameView(state) }));

  app.get("/v1/dashboard", async () => ({ dashboard: getDashboard(state) }));

  app.post("/v1/game/join", async (request) => {
    const result = mutate(() => joinPlayer(state, request.body || {}), { broadcastType: "join" });
    return result?.error ? result : { player: result.player, tanker: result.tanker, state: result.state };
  });

  app.post("/v1/game/input", async (request) => mutate(() => applyPlayerInput(state, request.body || {}), { persistAfter: false }));

  if (opts.enableTestRoutes) {
    app.post("/v1/game/tick", async (request) => {
      const deltaMs = Number(request.body?.deltaMs || tickMs);
      const result = stepGame(state, deltaMs);
      persist();
      broadcast("tick");
      return { state: result };
    });
  }

  app.get("/ws", { websocket: true }, (connection) => {
    const socket =
      typeof connection?.send === "function"
        ? connection
        : typeof connection?.socket?.send === "function"
          ? connection.socket
          : null;
    if (!socket || typeof socket.send !== "function") {
      return;
    }

    sockets.add(socket);
    socket.send(JSON.stringify({ type: "snapshot", state: getGameView(state), dashboard: getDashboard(state) }));

    socket.on("message", (raw) => {
      try {
        const payload = JSON.parse(raw.toString());
        if (payload.type === "ping") {
          socket.send(JSON.stringify({ type: "pong", state: getGameView(state), dashboard: getDashboard(state) }));
        }
      } catch {
        socket.send(JSON.stringify({ type: "error", message: "invalid json" }));
      }
    });

    socket.on("close", () => {
      sockets.delete(socket);
    });
  });

  if (startLoop) {
    interval = setInterval(() => {
      stepGame(state, tickMs);
      if (dirty || state.meta.revision % 10 === 0) {
        persist();
      }
      broadcast("tick");
    }, tickMs);
  }

  app.decorate("tankerState", state);
  app.decorate("tankerSockets", sockets);

  app.addHook("onClose", async () => {
    if (interval) {
      clearInterval(interval);
    }
    persist();
  });

  return app;
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  const app = await buildApp();
  const port = Number(process.env.PORT || 3000);
  await app.listen({ host: "0.0.0.0", port });
}
