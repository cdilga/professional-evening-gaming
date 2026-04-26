const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 900;
const DEPOT_RADIUS = 80;
const BASE_RADIUS = 92;
const TANKER_RADIUS = 18;
const DRONE_RADIUS = 12;
const MAX_EVENTS = 24;
const RESPAWN_MS = 4000;
const DRONE_SPAWN_MS = 2600;
const TICK_MS = 100;
const MAX_DELIVERY_HISTORY = 240;

export const FACTIONS = [
  { id: "coral", name: "Coral Nomads", color: "#ff7b72", base: { x: 180, y: 180 } },
  { id: "mist", name: "Mist Collective", color: "#7ee7ff", base: { x: 1420, y: 180 } },
  { id: "ember", name: "Ember Union", color: "#ffb347", base: { x: 180, y: 720 } },
  { id: "volt", name: "Volt Syndicate", color: "#b38cff", base: { x: 1420, y: 720 } },
];

function nowIso() {
  return new Date().toISOString();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function wrapAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function randomFrom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function baseForFaction(factionId) {
  return FACTIONS.find((f) => f.id === factionId)?.base || { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
}

function tankerSpeedMultiplierForName(name) {
  const normalized = String(name || "").toLowerCase();
  if (!normalized.includes("mike")) {
    return 1;
  }

  const digits = normalized.match(/\d/g) || [];
  if (!digits.length) {
    return 1;
  }

  const whole = Number(digits[0] || 1);
  const tenth = Number(digits[1] || 0) / 10;
  return clamp(whole + tenth, 1, 9);
}

function factionStatsTemplate(faction) {
  return {
    id: faction.id,
    name: faction.name,
    color: faction.color,
    score: 0,
    deliveries: 0,
    losses: 0,
    droneHits: 0,
    activeTankers: 0,
    control: 25,
  };
}

export function createGameState() {
  return {
    room: "tanker-command",
    world: {
      width: WORLD_WIDTH,
      height: WORLD_HEIGHT,
      depot: { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2, radius: DEPOT_RADIUS },
      tankerRadius: TANKER_RADIUS,
      droneRadius: DRONE_RADIUS,
      bases: FACTIONS.map((faction) => ({ ...faction.base, radius: BASE_RADIUS, factionId: faction.id })),
    },
    meta: {
      service: "peg-tanker-command",
      tickMs: TICK_MS,
      nextId: 1,
      startedAt: nowIso(),
      updatedAt: nowIso(),
      elapsedMs: 0,
      lastDroneSpawnAtMs: 0,
      revision: 0,
    },
    factions: FACTIONS.map(factionStatsTemplate),
    players: [],
    tankers: [],
    drones: [],
    events: [],
    telemetry: {
      totalBarrelsDelivered: 0,
      deliveryHistory: [{ elapsedMs: 0, delivered: 0, at: nowIso() }],
    },
  };
}

function nextId(state, prefix) {
  const id = `${prefix}-${state.meta.nextId}`;
  state.meta.nextId += 1;
  return id;
}

function pushEvent(state, type, message, extra = {}) {
  state.events.unshift({
    id: nextId(state, "event"),
    type,
    message,
    at: nowIso(),
    ...extra,
  });
  state.events = state.events.slice(0, MAX_EVENTS);
}

function ensureTelemetryState(state) {
  const telemetry = state.telemetry && typeof state.telemetry === "object" ? state.telemetry : {};
  const history = Array.isArray(telemetry.deliveryHistory) ? telemetry.deliveryHistory : [];
  state.telemetry = {
    totalBarrelsDelivered: Number(telemetry.totalBarrelsDelivered || 0),
    deliveryHistory: history
      .map((entry) => ({
        elapsedMs: Number(entry?.elapsedMs || 0),
        delivered: Number(entry?.delivered || 0),
        at: entry?.at || nowIso(),
      }))
      .sort((a, b) => a.elapsedMs - b.elapsedMs),
  };

  if (!state.telemetry.deliveryHistory.length) {
    state.telemetry.deliveryHistory.push({ elapsedMs: Number(state.meta?.elapsedMs || 0), delivered: 0, at: state.meta?.updatedAt || nowIso() });
  }

  const lastPoint = state.telemetry.deliveryHistory[state.telemetry.deliveryHistory.length - 1];
  if (lastPoint.delivered !== state.telemetry.totalBarrelsDelivered) {
    state.telemetry.deliveryHistory.push({
      elapsedMs: Number(state.meta?.elapsedMs || lastPoint.elapsedMs || 0),
      delivered: state.telemetry.totalBarrelsDelivered,
      at: state.meta?.updatedAt || nowIso(),
    });
  }

  state.telemetry.deliveryHistory = state.telemetry.deliveryHistory.slice(-MAX_DELIVERY_HISTORY);
  state.telemetry.totalBarrelsDelivered = Number(state.telemetry.deliveryHistory[state.telemetry.deliveryHistory.length - 1]?.delivered || 0);
}

function recordDeliveryHistory(state) {
  ensureTelemetryState(state);
  const point = {
    elapsedMs: state.meta.elapsedMs,
    delivered: state.telemetry.totalBarrelsDelivered,
    at: state.meta.updatedAt,
  };
  const history = state.telemetry.deliveryHistory;
  const lastPoint = history[history.length - 1];
  if (lastPoint && lastPoint.elapsedMs === point.elapsedMs) {
    history[history.length - 1] = point;
  } else if (!lastPoint || lastPoint.delivered !== point.delivered || lastPoint.elapsedMs !== point.elapsedMs) {
    history.push(point);
  }
  state.telemetry.deliveryHistory = history.slice(-MAX_DELIVERY_HISTORY);
}

function updateFactionMetrics(state) {
  for (const faction of state.factions) {
    const tankers = state.tankers.filter((tanker) => tanker.factionId === faction.id);
    const alive = tankers.filter((tanker) => tanker.alive).length;
    faction.activeTankers = alive;
    faction.score = tankers.reduce((sum, tanker) => sum + tanker.score, 0);
    faction.deliveries = tankers.reduce((sum, tanker) => sum + tanker.deliveries, 0);
    faction.losses = tankers.reduce((sum, tanker) => sum + tanker.losses, 0);
    faction.droneHits = tankers.reduce((sum, tanker) => sum + tanker.droneHits, 0);
    faction.control = clamp(25 + faction.deliveries * 8 + alive * 2 - faction.losses * 6, 0, 100);
  }
}

function computeDashboard(state) {
  ensureTelemetryState(state);
  updateFactionMetrics(state);
  const activeTankers = state.tankers.filter((tanker) => tanker.alive).length;
  const convoyLosses = state.tankers.reduce((sum, tanker) => sum + tanker.losses, 0);
  const droneHits = state.tankers.reduce((sum, tanker) => sum + tanker.droneHits, 0);
  const deliveries = state.tankers.reduce((sum, tanker) => sum + tanker.deliveries, 0);
  const scores = [...state.tankers]
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((tanker) => ({
      tankerId: tanker.id,
      playerId: tanker.playerId,
      playerName: state.players.find((player) => player.id === tanker.playerId)?.name || tanker.callsign,
      factionId: tanker.factionId,
      score: tanker.score,
      deliveries: tanker.deliveries,
      losses: tanker.losses,
      droneHits: tanker.droneHits,
      alive: tanker.alive,
    }));

  return {
    updatedAt: state.meta.updatedAt,
    activeTankers,
    convoyLosses,
    droneHits,
    deliveries,
    connectedPlayers: state.players.length,
    factionControl: state.factions.map(({ id, name, color, control, score, activeTankers: active, deliveries: drops, losses }) => ({
      id,
      name,
      color,
      control,
      score,
      activeTankers: active,
      deliveries: drops,
      losses,
    })),
    leaderboard: scores,
    recentEvents: state.events.slice(0, 10),
    telemetry: {
      totalBarrelsDelivered: state.telemetry.totalBarrelsDelivered,
      deliveryHistory: state.telemetry.deliveryHistory,
    },
  };
}

function gameView(state) {
  ensureTelemetryState(state);
  return {
    room: state.room,
    world: state.world,
    meta: state.meta,
    factions: state.factions,
    players: state.players,
    tankers: state.tankers,
    drones: state.drones,
    dashboard: computeDashboard(state),
    events: state.events,
    telemetry: state.telemetry,
  };
}

function bumpRevision(state) {
  state.meta.updatedAt = nowIso();
  state.meta.revision += 1;
}

function tankerTemplate(state, player) {
  const base = baseForFaction(player.factionId);
  return {
    id: nextId(state, "tanker"),
    playerId: player.id,
    factionId: player.factionId,
    speedMultiplier: tankerSpeedMultiplierForName(player.name),
    callsign: `${player.factionId.toUpperCase()}-${Math.floor(Math.random() * 90 + 10)}`,
    x: base.x + (Math.random() * 80 - 40),
    y: base.y + (Math.random() * 80 - 40),
    vx: 0,
    vy: 0,
    heading: Math.random() * Math.PI * 2,
    hp: 100,
    maxHp: 100,
    cargo: 0,
    score: 0,
    deliveries: 0,
    losses: 0,
    droneHits: 0,
    alive: true,
    respawnAtMs: null,
    controls: { thrust: 0, turn: 0 },
  };
}

export function joinPlayer(state, payload = {}) {
  const name = String(payload.name || payload.player || "").trim().slice(0, 40);
  const factionId = String(payload.faction_id || payload.factionId || "").trim();
  if (!name) {
    return { error: "name required" };
  }
  if (!FACTIONS.some((faction) => faction.id === factionId)) {
    return { error: "valid faction required" };
  }

  let player = state.players.find((item) => item.name.toLowerCase() === name.toLowerCase());
  if (!player) {
    player = {
      id: nextId(state, "player"),
      name,
      factionId,
      joinedAt: nowIso(),
      updatedAt: nowIso(),
    };
    state.players.push(player);
    const tanker = tankerTemplate(state, player);
    state.tankers.push(tanker);
    pushEvent(state, "join", `${name} launched for the ${FACTIONS.find((f) => f.id === factionId)?.name}.`, { playerId: player.id, factionId });
  } else {
    player.factionId = factionId;
    player.updatedAt = nowIso();
    let tanker = state.tankers.find((item) => item.playerId === player.id);
    if (!tanker) {
      tanker = tankerTemplate(state, player);
      state.tankers.push(tanker);
    } else {
      tanker.factionId = factionId;
      tanker.speedMultiplier = tankerSpeedMultiplierForName(player.name);
      const base = baseForFaction(factionId);
      tanker.x = base.x;
      tanker.y = base.y;
    }
    pushEvent(state, "rejoin", `${name} rejoined on the ${FACTIONS.find((f) => f.id === factionId)?.name}.`, { playerId: player.id, factionId });
  }

  bumpRevision(state);
  return { player, tanker: state.tankers.find((item) => item.playerId === player.id), state: gameView(state) };
}

export function applyPlayerInput(state, payload = {}) {
  const playerId = payload.player_id || payload.playerId;
  const tanker = state.tankers.find((item) => item.playerId === playerId);
  if (!tanker) {
    return { error: "player not found" };
  }
  tanker.controls = {
    thrust: clamp(Number(payload.thrust || 0), -1, 1),
    turn: clamp(Number(payload.turn || 0), -1, 1),
  };
  return { ok: true, tankerId: tanker.id };
}

function spawnDrone(state) {
  const liveTankers = state.tankers.filter((tanker) => tanker.alive);
  if (!liveTankers.length) {
    return false;
  }
  const target = randomFrom(liveTankers);
  const side = randomFrom(["left", "top", "right"]);
  let x = -50;
  let y = 40 + Math.random() * (WORLD_HEIGHT - 80);
  if (side === "top") {
    x = 40 + Math.random() * (WORLD_WIDTH - 80);
    y = -40;
  }
  if (side === "right") {
    x = WORLD_WIDTH + 50;
    y = 40 + Math.random() * (WORLD_HEIGHT - 80);
  }

  const dx = target.x - x;
  const dy = target.y - y;
  const distanceToTarget = Math.max(Math.hypot(dx, dy), 1);
  const speed = 180 + Math.random() * 80;
  const drone = {
    id: nextId(state, "drone"),
    x,
    y,
    vx: (dx / distanceToTarget) * speed,
    vy: (dy / distanceToTarget) * speed - 120,
    gravityY: 180 + Math.random() * 80,
    targetTankerId: target.id,
    ttlMs: 8000,
  };
  state.drones.push(drone);
  pushEvent(state, "drone-spawn", `AI drones are diving on ${target.callsign}.`, { tankerId: target.id, factionId: target.factionId });
  return true;
}

function respawnTanker(state, tanker) {
  const base = baseForFaction(tanker.factionId);
  tanker.alive = true;
  tanker.hp = tanker.maxHp;
  tanker.cargo = 0;
  tanker.vx = 0;
  tanker.vy = 0;
  tanker.x = base.x + (Math.random() * 60 - 30);
  tanker.y = base.y + (Math.random() * 60 - 30);
  tanker.respawnAtMs = null;
  pushEvent(state, "respawn", `${tanker.callsign} is back in the water.`, { tankerId: tanker.id, factionId: tanker.factionId });
}

function sinkTanker(state, tanker) {
  tanker.alive = false;
  tanker.losses += 1;
  tanker.score = Math.max(0, tanker.score - 40);
  tanker.cargo = 0;
  tanker.respawnAtMs = state.meta.elapsedMs + RESPAWN_MS;
  pushEvent(state, "loss", `${tanker.callsign} got cooked by drones.`, { tankerId: tanker.id, factionId: tanker.factionId });
}

export function stepGame(state, deltaMs = TICK_MS) {
  ensureTelemetryState(state);
  const dt = deltaMs / 1000;
  let changed = false;
  state.meta.elapsedMs += deltaMs;

  if (state.meta.elapsedMs - state.meta.lastDroneSpawnAtMs >= DRONE_SPAWN_MS) {
    changed = spawnDrone(state) || changed;
    state.meta.lastDroneSpawnAtMs = state.meta.elapsedMs;
  }

  for (const tanker of state.tankers) {
    if (!tanker.alive) {
      if (tanker.respawnAtMs && state.meta.elapsedMs >= tanker.respawnAtMs) {
        respawnTanker(state, tanker);
        changed = true;
      }
      continue;
    }

    tanker.heading = wrapAngle(tanker.heading + tanker.controls.turn * 1.8 * dt);
    const speedMultiplier = clamp(Number(tanker.speedMultiplier || 1), 1, 9);
    const accel = tanker.controls.thrust * 90 * speedMultiplier;
    tanker.vx += Math.cos(tanker.heading) * accel * dt;
    tanker.vy += Math.sin(tanker.heading) * accel * dt;
    tanker.vx *= 0.985;
    tanker.vy *= 0.985;

    const speed = Math.hypot(tanker.vx, tanker.vy);
    const maxSpeed = 190 * speedMultiplier;
    if (speed > maxSpeed) {
      tanker.vx = (tanker.vx / speed) * maxSpeed;
      tanker.vy = (tanker.vy / speed) * maxSpeed;
    }

    tanker.x = clamp(tanker.x + tanker.vx * dt, TANKER_RADIUS, WORLD_WIDTH - TANKER_RADIUS);
    tanker.y = clamp(tanker.y + tanker.vy * dt, TANKER_RADIUS, WORLD_HEIGHT - TANKER_RADIUS);

    const depotDistance = distance(tanker, state.world.depot);
    if (!tanker.cargo && depotDistance <= DEPOT_RADIUS) {
      tanker.cargo = 1;
      tanker.score += 10;
      pushEvent(state, "cargo-load", `${tanker.callsign} loaded convoy cargo.`, { tankerId: tanker.id, factionId: tanker.factionId });
      changed = true;
    }

    const base = baseForFaction(tanker.factionId);
    if (tanker.cargo && distance(tanker, base) <= BASE_RADIUS) {
      tanker.cargo = 0;
      tanker.deliveries += 1;
      tanker.score += 100;
      state.telemetry.totalBarrelsDelivered += 1;
      recordDeliveryHistory(state);
      pushEvent(state, "delivery", `${tanker.callsign} delivered a convoy run.`, { tankerId: tanker.id, factionId: tanker.factionId, totalBarrelsDelivered: state.telemetry.totalBarrelsDelivered });
      changed = true;
    }
  }

  const activeDroneCount = state.drones.length;
  const survivors = [];
  for (const drone of state.drones) {
    drone.ttlMs -= deltaMs;
    drone.vy += drone.gravityY * dt;

    const target = state.tankers.find((tanker) => tanker.id === drone.targetTankerId && tanker.alive);
    if (target) {
      const dx = target.x - drone.x;
      const dy = target.y - drone.y;
      drone.vx += clamp(dx * 0.02, -18, 18) * dt;
      drone.vy += clamp(dy * 0.02, -12, 12) * dt;
    }

    drone.x += drone.vx * dt;
    drone.y += drone.vy * dt;

    if (target && distance(drone, target) <= TANKER_RADIUS + DRONE_RADIUS + 2) {
      target.hp = clamp(target.hp - 34, 0, target.maxHp);
      target.droneHits += 1;
      target.score = Math.max(0, target.score - 15);
      pushEvent(state, "drone-hit", `${target.callsign} copped a drone hit.`, { tankerId: target.id, factionId: target.factionId });
      changed = true;
      if (target.hp <= 0) {
        sinkTanker(state, target);
        changed = true;
      }
      continue;
    }

    const outOfBounds = drone.x < -120 || drone.x > WORLD_WIDTH + 120 || drone.y > WORLD_HEIGHT + 150 || drone.y < -160;
    if (!outOfBounds && drone.ttlMs > 0) {
      survivors.push(drone);
    }
  }
  state.drones = survivors;
  changed = changed || survivors.length !== activeDroneCount;

  if (changed) {
    bumpRevision(state);
  }
  return { state: gameView(state), changed };
}

export function getDashboard(state) {
  return computeDashboard(state);
}

export function getGameView(state) {
  return gameView(state);
}

export function getHealthView(state, connectedClients = 0) {
  ensureTelemetryState(state);
  const dashboard = computeDashboard(state);
  return {
    status: "ok",
    service: "peg-tanker-command",
    connectedClients,
    activeTankers: dashboard.activeTankers,
    connectedPlayers: dashboard.connectedPlayers,
    droneHits: dashboard.droneHits,
    convoyLosses: dashboard.convoyLosses,
    deliveries: dashboard.deliveries,
    totalBarrelsDelivered: state.telemetry.totalBarrelsDelivered,
    revision: state.meta.revision,
  };
}
