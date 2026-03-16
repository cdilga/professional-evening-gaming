import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Fastify from "fastify";
import websocket from "@fastify/websocket";

const DEFAULT_STATE_PATH = "/data/state.json";

function createState() {
  return {
    room: "main-lobby",
    players: [],
    updatedAt: new Date().toISOString(),
  };
}

function loadState(statePath) {
  try {
    const raw = fs.readFileSync(statePath, "utf8");
    const loaded = JSON.parse(raw);
    // Migrate from old string[] format to {name, ready}[] format
    if (loaded.players?.length && typeof loaded.players[0] === "string") {
      loaded.players = loaded.players.map((name) => ({ name, ready: false }));
      delete loaded.readyCount;
    }
    return loaded;
  } catch {
    return createState();
  }
}

function saveState(statePath, state) {
  const dir = path.dirname(statePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function readyCount(state) {
  return state.players.filter((p) => p.ready).length;
}

function allReady(state) {
  return state.players.length > 0 && state.players.every((p) => p.ready);
}

function stateView(state) {
  return {
    ...state,
    readyCount: readyCount(state),
    totalPlayers: state.players.length,
    allReady: allReady(state),
  };
}

export function buildApp(opts = {}) {
  const statePath = opts.statePath ?? process.env.STATE_PATH ?? DEFAULT_STATE_PATH;
  const app = Fastify({ logger: !opts.statePath });
  const state = loadState(statePath);
  const sockets = new Set();

  function broadcast(type = "update") {
    const message = JSON.stringify({ type, state: stateView(state) });
    for (const socket of sockets) {
      try {
        socket.send(message);
      } catch {
        sockets.delete(socket);
      }
    }
  }

  app.register(websocket);

  app.get("/health", async () => ({
    status: "ok",
    service: "peg-live-lobby",
    room: state.room,
    connectedClients: sockets.size,
    readyCount: readyCount(state),
    totalPlayers: state.players.length,
    allReady: allReady(state),
  }));

  app.get("/v1/lobby", async () => ({ state: stateView(state) }));

  app.post("/v1/lobby/ready", async (request) => {
    const payload = request.body || {};
    if (!payload.player) {
      return { error: "player name required" };
    }

    const existing = state.players.find((p) => p.name === payload.player);
    if (existing) {
      existing.ready = !existing.ready;
    } else {
      state.players.push({ name: payload.player, ready: true });
    }

    state.updatedAt = new Date().toISOString();
    saveState(statePath, state);
    broadcast();
    return { state: stateView(state) };
  });

  app.get("/ws", { websocket: true }, (socket) => {
    sockets.add(socket);
    socket.send(JSON.stringify({ type: "snapshot", state: stateView(state) }));

    socket.on("message", (raw) => {
      try {
        const payload = JSON.parse(raw.toString());
        if (payload.type === "ping") {
          socket.send(JSON.stringify({ type: "pong", state: stateView(state) }));
        }
      } catch {
        socket.send(JSON.stringify({ type: "error", message: "invalid json" }));
      }
    });

    socket.on("close", () => {
      sockets.delete(socket);
    });
  });

  app.decorate("lobbyState", state);
  app.decorate("lobbySockets", sockets);

  return app;
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  const app = buildApp();
  const port = Number(process.env.PORT || 3000);
  await app.listen({ host: "0.0.0.0", port });
}
