import Fastify from "fastify";
import websocket from "@fastify/websocket";

const app = Fastify({ logger: true });
await app.register(websocket);

const state = {
  room: "main-lobby",
  players: ["astacus", "cass", "the lads"],
  readyCount: 1,
  updatedAt: new Date().toISOString(),
};

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

const port = Number(process.env.PORT || 3000);
await app.listen({ host: "0.0.0.0", port });
