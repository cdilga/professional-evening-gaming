const yearTarget = document.querySelector("[data-year]");
const projectGrids = document.querySelectorAll("[data-project-grid]");
const demoRoot = document.querySelector("[data-demo]");

const BROWSER_SUPPORT_RULES = [
  "Brave (nightlies only)",
  "IE 11",
  "Netscape 3.2",
  "Opera 2-120, 130+",
  "Firefox (non-Chromium builds only)",
  "Safari on any macOS version",
];

const PLATFORM_UPGRADE_LINKS = {
  iphone: [
    { label: "Install Safari on macOS", href: "https://support.apple.com/downloads/safari" },
    { label: "Get Firefox for iPhone", href: "https://apps.apple.com/app/firefox-private-safe-browser/id989804926" },
    { label: "Get Opera for iPhone", href: "https://apps.apple.com/app/opera-browser-web-browser/id1411869974" },
  ],
  ipad: [
    { label: "Install Safari on macOS", href: "https://support.apple.com/downloads/safari" },
    { label: "Get Firefox for iPad", href: "https://apps.apple.com/app/firefox-private-safe-browser/id989804926" },
    { label: "Get Opera for iPad", href: "https://apps.apple.com/app/opera-browser-web-browser/id1411869974" },
  ],
  android: [
    { label: "Get Firefox for Android", href: "https://play.google.com/store/apps/details?id=org.mozilla.firefox" },
    { label: "Get Opera for Android", href: "https://play.google.com/store/apps/details?id=com.opera.browser" },
    { label: "Brave releases", href: "https://brave.com/download-nightly/" },
  ],
  mac: [
    { label: "Install Safari", href: "https://support.apple.com/downloads/safari" },
    { label: "Get Firefox", href: "https://www.mozilla.org/firefox/new/" },
    { label: "Brave nightly builds", href: "https://brave.com/download-nightly/" },
  ],
  windows: [
    { label: "Install Firefox", href: "https://www.mozilla.org/firefox/new/" },
    { label: "Install Opera", href: "https://www.opera.com/download" },
    { label: "Brave nightly builds", href: "https://brave.com/download-nightly/" },
  ],
  linux: [
    { label: "Install Firefox", href: "https://www.mozilla.org/firefox/new/" },
    { label: "Install Opera", href: "https://www.opera.com/download" },
    { label: "Brave nightly builds", href: "https://brave.com/download-nightly/" },
  ],
  other: [
    { label: "Install Firefox", href: "https://www.mozilla.org/firefox/new/" },
    { label: "Install Opera", href: "https://www.opera.com/download" },
    { label: "Brave nightly builds", href: "https://brave.com/download-nightly/" },
  ],
};

if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

function detectBrowserSupport() {
  const ua = navigator.userAgent || "";
  const vendor = navigator.vendor || "";
  const isIPhone = /iPhone/i.test(ua);
  const isIPad = /iPad/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isMac = /Macintosh|Mac OS X/i.test(ua);
  const isWindows = /Windows/i.test(ua);
  const isLinux = /Linux|X11/i.test(ua);
  const isIE11 = /Trident\/7\.0|rv:11\.0/i.test(ua);
  const isNetscape32 = /Netscape\/3\.2/i.test(ua);
  const operaMatch = ua.match(/(?:Opera|OPR)\/(\d+)/i);
  const operaVersion = operaMatch ? Number.parseInt(operaMatch[1], 10) : null;
  const isOperaSupported = Number.isFinite(operaVersion) && (operaVersion <= 120 || operaVersion >= 130);
  const isFirefox = /Firefox\/(\d+)/i.test(ua) && !/Edg\//i.test(ua) && !/OPR\//i.test(ua) && !/Brave/i.test(ua);
  const isSafari = /Safari\//i.test(ua) && /Apple/i.test(vendor) && !/Chrome|CriOS|Edg|OPR|Firefox|FxiOS/i.test(ua);
  const isMacSafari = isSafari && isMac;
  const isBraveNightly = navigator.brave && /Chrome\/([\d.]+)/i.test(ua) && /Mobile/i.test(ua) === false;
  const supported = Boolean(isBraveNightly || isIE11 || isNetscape32 || isOperaSupported || isFirefox || isMacSafari);

  let platform = "other";
  if (isIPhone) platform = "iphone";
  else if (isIPad) platform = "ipad";
  else if (isAndroid) platform = "android";
  else if (isMac) platform = "mac";
  else if (isWindows) platform = "windows";
  else if (isLinux) platform = "linux";

  return {
    supported,
    isIPhone,
    platform,
  };
}

function dismissSupportModal() {
  const modal = document.querySelector("[data-support-modal]");
  if (!modal) {
    return;
  }
  modal.hidden = true;
  document.body.classList.remove("has-support-modal");
  try {
    localStorage.setItem("peg-browser-support-dismissed", "true");
  } catch {
    // ignore storage issues
  }
}

function setupBrowserSupportNotice() {
  const { supported, isIPhone, platform } = detectBrowserSupport();
  document.body.dataset.browserSupport = supported ? "supported" : "unsupported";
  document.body.dataset.iphoneAlpha = isIPhone ? "true" : "false";

  const upgradeLinks = (PLATFORM_UPGRADE_LINKS[platform] || PLATFORM_UPGRADE_LINKS.other)
    .map((link) => `<li><a href="${link.href}" target="_blank" rel="noreferrer">${link.label}</a></li>`)
    .join("");

  const noticeHost = document.createElement("div");
  noticeHost.innerHTML = `
    <div class="browser-support-banner" data-support-banner ${supported ? "hidden" : ""}>
      <div>
        <strong>Unsupported browser, mate.</strong>
        <span>This thing officially supports ${BROWSER_SUPPORT_RULES.join(", ")}. ${isIPhone ? "iPhone users are on the alpha." : ""} If you just want a proper destination, jump into <a href="/projects/peg-tanker-command/">PEG Tanker Command</a>.</span>
      </div>
    </div>
    <div class="browser-support-modal" data-support-modal ${supported ? "hidden" : ""}>
      <div class="browser-support-modal-card panel" role="dialog" aria-modal="true" aria-labelledby="browser-support-title">
        <p class="eyebrow">Compatibility warning</p>
        <h2 id="browser-support-title">Your browser is off the blessed list.</h2>
        <p class="browser-support-copy">Supported browsers:</p>
        <ul class="principle-list compact-list browser-support-list">
          ${BROWSER_SUPPORT_RULES.map((rule) => `<li>${rule}</li>`).join("")}
        </ul>
        <p class="browser-support-copy">${isIPhone ? "iPhone users are on the alpha." : "If you're not on that list, expect a bit of chaos."}</p>
        <p class="browser-support-copy">Grab a supported browser for your platform, or take the scenic PEG route into the live convoy prototype:</p>
        <ul class="principle-list compact-list browser-support-links">
          <li><a href="/projects/peg-tanker-command/">Open PEG Tanker Command</a></li>
          ${upgradeLinks}
        </ul>
        <button class="button button-primary" type="button" data-support-dismiss>Fair enough</button>
      </div>
    </div>
  `;
  document.body.appendChild(noticeHost);

  const dismiss = noticeHost.querySelector("[data-support-dismiss]");
  dismiss?.addEventListener("click", dismissSupportModal);

  if (!supported) {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem("peg-browser-support-dismissed") === "true";
    } catch {
      dismissed = false;
    }
    if (!dismissed) {
      document.body.classList.add("has-support-modal");
    } else {
      dismissSupportModal();
    }
  }
}

setupBrowserSupportNotice();

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderProjectCard(project) {
  const tags = [project.stack.frontend, project.stack.api, project.stack.database]
    .filter(Boolean)
    .map((value) => `<span>${value}</span>`)
    .join("");

  const apiLink = project.links.apiDocs || project.links.apiBase;
  const repoLink = project.links.repoPath ? `https://github.com/cdilga/professional-evening-gaming/tree/main/${project.links.repoPath}` : null;

  return `
    <article class="project-card">
      <div class="project-card-header">
        <div>
          <p class="mini-label">${project.slug}</p>
          <h3>${project.name}</h3>
        </div>
        <span class="project-status">${project.status}</span>
      </div>
      <p class="project-summary">${project.summary}</p>
      <p class="project-summary">${project.tagline}</p>
      <div class="project-tags">${tags}</div>
      <div class="project-card-links">
        <a href="${project.links.page}">Open project</a>
        ${repoLink ? `<a href="${repoLink}">Source</a>` : ""}
        ${apiLink ? `<a href="${apiLink}">API</a>` : ""}
      </div>
    </article>
  `;
}

async function loadProjects() {
  if (!projectGrids.length) {
    return;
  }

  try {
    const response = await fetch("/data/projects.json");
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.status}`);
    }

    const payload = await response.json();
    const projects = payload.projects || [];

    projectGrids.forEach((grid) => {
      const featuredOnly = grid.dataset.featuredOnly === "true";
      const visibleProjects = featuredOnly ? projects.filter((project) => project.featured) : projects;
      grid.innerHTML = visibleProjects.map(renderProjectCard).join("");
    });
  } catch (error) {
    projectGrids.forEach((grid) => {
      grid.innerHTML = `<article class="project-card"><p>Project registry unavailable right now.</p></article>`;
    });
    console.error(error);
  }
}

function setDemoStatus(root, message, kind = "neutral") {
  const status = root.querySelector("[data-demo-status]");
  if (!status) {
    return;
  }
  status.textContent = message;
  status.dataset.state = kind;
}

function renderAstacusItem(item) {
  return `
    <article class="demo-item">
      <strong>${escapeHtml(item.author || "unknown mate")}</strong>
      <p>${escapeHtml(item.body || "")}</p>
      <span>${escapeHtml(item.created_at || "just now")}</span>
    </article>
  `;
}

function renderSessionItem(item) {
  return `
    <article class="demo-item">
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.game_name)} - ${escapeHtml(item.status || "planned")}</p>
      <span>${escapeHtml(item.scheduled_for || item.created_at || "TBA")}</span>
    </article>
  `;
}

function renderLobbyState(state, wsStatus = "not connected") {
  const players = (state.players || []).map((player) => {
    if (typeof player === "string") {
      return `<li>${escapeHtml(player)}</li>`;
    }
    const indicator = player.ready ? "ready" : "waiting";
    const session = player.sessionId ? ` · session ${escapeHtml(player.sessionId)}` : "";
    return `<li data-ready="${indicator}">${escapeHtml(player.name)} <small>(${indicator}${session})</small></li>`;
  }).join("");

  const total = state.totalPlayers || 0;
  const ready = state.readyCount || 0;
  const allReady = state.allReady;
  const progressText = total > 0 ? `${ready}/${total} ready` : "No players yet";
  const allReadyBanner = allReady ? `<p class="demo-all-ready">All players ready!</p>` : "";

  return `
    <article class="demo-item${allReady ? " demo-item-ready" : ""}">
      <strong>${escapeHtml(state.room || "main-lobby")}</strong>
      <p>${escapeHtml(progressText)} · ${escapeHtml(wsStatus)}</p>
      ${allReadyBanner}
      <ul class="demo-inline-list">${players}</ul>
      <span>Updated ${escapeHtml(state.updatedAt || "just now")}</span>
    </article>
  `;
}

async function setupAstacusDemo(root) {
  const apiBase = root.dataset.apiBase;
  const form = root.querySelector("[data-demo-form]");
  const list = root.querySelector("[data-demo-list]");

  async function refresh() {
    const response = await fetch(`${apiBase}/astacus-bot/notes`);
    if (!response.ok) {
      throw new Error(`Astacus notes failed: ${response.status}`);
    }
    const payload = await response.json();
    list.innerHTML = (payload.items || []).map(renderAstacusItem).join("") || '<article class="demo-item"><p>No notes yet.</p></article>';
    setDemoStatus(root, "API live", "ok");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    setDemoStatus(root, "Posting note...", "busy");
    const response = await fetch(`${apiBase}/astacus-bot/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author: data.get("author"),
        body: data.get("body"),
      }),
    });
    if (!response.ok) {
      setDemoStatus(root, "Could not post note", "error");
      return;
    }
    form.reset();
    await refresh();
  });

  await refresh();
}

async function setupSessionHubDemo(root) {
  const apiBase = root.dataset.apiBase;
  const form = root.querySelector("[data-demo-form]");
  const list = root.querySelector("[data-demo-list]");

  async function refresh() {
    const [healthResponse, sessionsResponse] = await Promise.all([
      fetch(`${apiBase}/health`),
      fetch(`${apiBase}/v1/sessions`),
    ]);
    if (!healthResponse.ok || !sessionsResponse.ok) {
      throw new Error("Session Hub fetch failed");
    }
    const health = await healthResponse.json();
    const payload = await sessionsResponse.json();
    list.innerHTML = (payload.items || []).map(renderSessionItem).join("") || '<article class="demo-item"><p>No sessions planned yet. Add one.</p></article>';
    setDemoStatus(root, `${health.database.sessions} sessions in Postgres`, "ok");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const scheduledFor = data.get("scheduled_for");
    setDemoStatus(root, "Saving to Postgres...", "busy");
    const response = await fetch(`${apiBase}/v1/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.get("title"),
        game_name: data.get("game_name"),
        scheduled_for: scheduledFor ? new Date(String(scheduledFor)).toISOString() : null,
      }),
    });
    if (!response.ok) {
      setDemoStatus(root, "Could not save session", "error");
      return;
    }
    form.reset();
    await refresh();
  });

  await refresh();
}

async function setupLiveLobbyDemo(root) {
  const apiBase = root.dataset.apiBase;
  const sessionHubBase = apiBase.replace(/\/live-lobby$/, "/session-hub");
  const form = root.querySelector("[data-demo-form]");
  const list = root.querySelector("[data-demo-list]");
  const refreshButton = root.querySelector("[data-demo-refresh]");
  const wsButton = root.querySelector("[data-demo-ws]");
  const sessionSelect = root.querySelector("[data-session-select]");
  let websocketStatus = "not connected";
  let liveSocket = null;

  function renderState(state) {
    list.innerHTML = renderLobbyState(state || {}, websocketStatus);
  }

  async function loadSessions() {
    try {
      const response = await fetch(`${sessionHubBase}/v1/sessions`);
      if (!response.ok) return;
      const payload = await response.json();
      const sessions = payload.items || [];
      sessions.forEach((session) => {
        const option = document.createElement("option");
        option.value = String(session.id);
        option.textContent = `${session.title} (${session.game_name})`;
        sessionSelect.appendChild(option);
      });
    } catch {
      const option = document.createElement("option");
      option.disabled = true;
      option.textContent = "Session Hub unavailable";
      sessionSelect.appendChild(option);
    }
  }

  async function refresh() {
    const sessionId = sessionSelect?.value || "";
    const query = sessionId ? `?session_id=${sessionId}` : "";
    const [healthResponse, lobbyResponse] = await Promise.all([
      fetch(`${apiBase}/health`),
      fetch(`${apiBase}/v1/lobby${query}`),
    ]);
    if (!healthResponse.ok || !lobbyResponse.ok) {
      throw new Error("Live Lobby fetch failed");
    }
    const health = await healthResponse.json();
    const payload = await lobbyResponse.json();
    renderState(payload.state);
    const clients = health.connectedClients || 0;
    setDemoStatus(root, `Live - ${clients} connected`, "ok");
  }

  function connectSocket() {
    const wsUrl = apiBase.replace(/^http/, "ws") + "/ws";
    liveSocket = new WebSocket(wsUrl);

    liveSocket.addEventListener("open", () => {
      websocketStatus = "connected";
      setDemoStatus(root, "WebSocket live", "ok");
    });

    liveSocket.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "snapshot" || msg.type === "update" || msg.type === "pong") {
          renderState(msg.state);
          if (msg.type === "update") {
            websocketStatus = "live broadcast received";
            setDemoStatus(root, "Live update", "ok");
          }
        }
      } catch { /* ignore malformed */ }
    });

    liveSocket.addEventListener("close", () => {
      websocketStatus = "disconnected";
      setDemoStatus(root, "WebSocket closed - reconnecting...", "busy");
      setTimeout(connectSocket, 3000);
    });

    liveSocket.addEventListener("error", () => {
      websocketStatus = "error";
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const sessionId = data.get("session_id") || null;
    setDemoStatus(root, "Sending ready check...", "busy");
    const body = { player: data.get("player") };
    if (sessionId) body.session_id = sessionId;
    const response = await fetch(`${apiBase}/v1/lobby/ready`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      setDemoStatus(root, "Could not update lobby", "error");
      return;
    }
    form.querySelector('input[name="player"]').value = "";
  });

  sessionSelect?.addEventListener("change", refresh);
  refreshButton?.addEventListener("click", refresh);
  wsButton?.addEventListener("click", () => {
    if (liveSocket && liveSocket.readyState === WebSocket.OPEN) {
      liveSocket.send(JSON.stringify({ type: "ping" }));
      setDemoStatus(root, "Ping sent", "busy");
    } else {
      setDemoStatus(root, "WebSocket not connected", "error");
    }
  });

  await loadSessions();
  await refresh();
  connectSocket();
}

function renderTankerDashboard(dashboard) {
  const metrics = [
    { label: "Active tankers", value: dashboard.activeTankers ?? 0 },
    { label: "Drone hits", value: dashboard.droneHits ?? 0 },
    { label: "Convoy losses", value: dashboard.convoyLosses ?? 0 },
    { label: "Deliveries", value: dashboard.deliveries ?? 0 },
  ];

  return metrics.map((metric) => `
    <article class="demo-item tanker-metric-card">
      <strong>${escapeHtml(metric.value)}</strong>
      <p>${escapeHtml(metric.label)}</p>
    </article>
  `).join("");
}

function renderFactionBoard(items) {
  return (items || []).map((faction) => `
    <article class="demo-item tanker-faction-card">
      <strong>${escapeHtml(faction.name)}</strong>
      <p>Control ${escapeHtml(faction.control)}% · Score ${escapeHtml(faction.score)}</p>
      <span>${escapeHtml(faction.activeTankers)} active · ${escapeHtml(faction.deliveries)} deliveries · ${escapeHtml(faction.losses)} losses</span>
    </article>
  `).join("");
}

function renderTankerEvents(events) {
  return (events || []).map((event) => `
    <article class="demo-item">
      <strong>${escapeHtml(event.type)}</strong>
      <p>${escapeHtml(event.message)}</p>
      <span>${escapeHtml(event.at || "now")}</span>
    </article>
  `).join("");
}

function drawTankerGame(canvas, state, localPlayerId) {
  if (!canvas || !state?.world) {
    return;
  }
  const ctx = canvas.getContext("2d");
  const { width, height, depot, bases, tankerRadius, droneRadius } = state.world;
  const sx = canvas.width / width;
  const sy = canvas.height / height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const water = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  water.addColorStop(0, "#071827");
  water.addColorStop(1, "#113153");
  ctx.fillStyle = water;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  for (let x = 0; x <= width; x += 160) {
    ctx.beginPath();
    ctx.moveTo(x * sx, 0);
    ctx.lineTo(x * sx, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += 120) {
    ctx.beginPath();
    ctx.moveTo(0, y * sy);
    ctx.lineTo(canvas.width, y * sy);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(245, 216, 93, 0.2)";
  ctx.beginPath();
  ctx.arc(depot.x * sx, depot.y * sy, depot.radius * sx, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f5d85d";
  ctx.font = "600 14px IBM Plex Mono";
  ctx.fillText("DEPOT", depot.x * sx - 28, depot.y * sy + 4);

  (bases || []).forEach((base) => {
    const faction = (state.factions || []).find((item) => item.id === base.factionId);
    ctx.fillStyle = `${faction?.color || "#fff"}33`;
    ctx.beginPath();
    ctx.arc(base.x * sx, base.y * sy, base.radius * sx, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = faction?.color || "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = faction?.color || "#fff";
    ctx.fillText((faction?.name || base.factionId).toUpperCase(), base.x * sx - 50, base.y * sy - 6);
  });

  (state.drones || []).forEach((drone) => {
    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.arc(drone.x * sx, drone.y * sy, droneRadius * sx, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 209, 102, 0.3)";
    ctx.beginPath();
    ctx.moveTo(drone.x * sx, drone.y * sy);
    ctx.lineTo((drone.x - drone.vx * 0.1) * sx, (drone.y - drone.vy * 0.1) * sy);
    ctx.stroke();
  });

  (state.tankers || []).forEach((tanker) => {
    const faction = (state.factions || []).find((item) => item.id === tanker.factionId);
    const color = faction?.color || "#fff";
    const x = tanker.x * sx;
    const y = tanker.y * sy;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tanker.heading);
    ctx.fillStyle = tanker.alive ? color : "#555";
    ctx.strokeStyle = tanker.playerId === localPlayerId ? "#fff" : "rgba(255,255,255,0.35)";
    ctx.lineWidth = tanker.playerId === localPlayerId ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(tankerRadius * sx, 0);
    ctx.lineTo(-tankerRadius * sx, -10 * sy);
    ctx.lineTo(-10 * sx, 0);
    ctx.lineTo(-tankerRadius * sx, 10 * sy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (tanker.cargo) {
      ctx.fillStyle = "#f5d85d";
      ctx.fillRect(-2, -2, 12, 12);
    }
    ctx.restore();

    ctx.fillStyle = tanker.playerId === localPlayerId ? "#ffffff" : "rgba(255,255,255,0.8)";
    ctx.font = "500 12px IBM Plex Mono";
    ctx.fillText(`${tanker.callsign} ${tanker.hp}hp`, x + 14, y - 14);
  });
}

async function setupTankerCommandDemo(root) {
  const apiBase = root.dataset.apiBase;
  const form = root.querySelector("[data-demo-form]");
  const list = root.querySelector("[data-demo-list]");
  const refreshButton = root.querySelector("[data-demo-refresh]");
  const canvas = root.querySelector("[data-tanker-canvas]");
  const metricsRoot = document.querySelector("[data-tanker-metrics]");
  const leaderboardRoot = document.querySelector("[data-tanker-leaderboard]");
  const eventsRoot = document.querySelector("[data-tanker-events]");
  const playerStatus = root.querySelector("[data-player-status]");
  const connectionStatus = root.querySelector("[data-connection-status]");

  let playerId = null;
  let state = null;
  let inputTimer = null;
  let socket = null;
  const controls = { thrust: 0, turn: 0 };

  try {
    playerId = localStorage.getItem("peg-tanker-command-player-id") || null;
    form.querySelector('input[name="player"]').value = localStorage.getItem("peg-tanker-command-player-name") || "";
    form.querySelector('select[name="faction_id"]').value = localStorage.getItem("peg-tanker-command-faction") || "coral";
  } catch {
    // ignore storage issues
  }

  function render(payloadState) {
    state = payloadState;
    const dashboard = payloadState?.dashboard || {};
    metricsRoot.innerHTML = renderTankerDashboard(dashboard);
    leaderboardRoot.innerHTML = `
      <p class="eyebrow">Leaderboard + faction board</p>
      ${renderFactionBoard(dashboard.factionControl || [])}
      ${(dashboard.leaderboard || []).map((entry) => `<article class="demo-item"><strong>${escapeHtml(entry.playerName)}</strong><p>${escapeHtml(entry.score)} score · ${escapeHtml(entry.deliveries)} deliveries · ${escapeHtml(entry.droneHits)} drone hits</p><span>${escapeHtml(entry.factionId)}${entry.alive ? "" : " · sunk"}</span></article>`).join("")}
    `;
    eventsRoot.innerHTML = `<p class="eyebrow">Recent game events</p>${renderTankerEvents(dashboard.recentEvents || [])}`;
    list.innerHTML = `<article class="demo-item"><strong>${escapeHtml(dashboard.connectedPlayers || 0)} captains online</strong><p>${escapeHtml(dashboard.activeTankers || 0)} active tankers on the water</p><span>Revision ${escapeHtml(payloadState?.meta?.revision || 0)}</span></article>`;
    drawTankerGame(canvas, payloadState, playerId);

    const myTanker = (payloadState?.tankers || []).find((tanker) => tanker.playerId === playerId);
    playerStatus.textContent = myTanker ? `${myTanker.callsign} · ${myTanker.hp}hp · ${myTanker.cargo ? "cargo loaded" : "empty"}` : "Spectating";
  }

  async function refresh() {
    const response = await fetch(`${apiBase}/v1/game`);
    if (!response.ok) {
      throw new Error(`Tanker Command fetch failed: ${response.status}`);
    }
    const payload = await response.json();
    render(payload.state);
    setDemoStatus(root, "Game state live", "ok");
  }

  async function sendInput() {
    if (!playerId) {
      return;
    }
    await fetch(`${apiBase}/v1/game/input`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_id: playerId, thrust: controls.thrust, turn: controls.turn }),
    });
  }

  function setControl(key, active) {
    const previous = { ...controls };
    if (key === "w") controls.thrust = active ? 1 : controls.thrust === 1 ? 0 : controls.thrust;
    if (key === "s") controls.thrust = active ? -1 : controls.thrust === -1 ? 0 : controls.thrust;
    if (key === "a") controls.turn = active ? -1 : controls.turn === -1 ? 0 : controls.turn;
    if (key === "d") controls.turn = active ? 1 : controls.turn === 1 ? 0 : controls.turn;
    if (previous.thrust !== controls.thrust || previous.turn !== controls.turn) {
      sendInput().catch(() => setDemoStatus(root, "Input send failed", "error"));
    }
  }

  function connectSocket() {
    const wsUrl = apiBase.replace(/^http/, "ws") + "/ws";
    socket = new WebSocket(wsUrl);
    connectionStatus.textContent = "Connecting WS...";

    socket.addEventListener("open", () => {
      connectionStatus.textContent = "WebSocket live";
      setDemoStatus(root, "Realtime feed connected", "ok");
    });

    socket.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.state) {
          render(payload.state);
        }
      } catch {
        // ignore
      }
    });

    socket.addEventListener("close", () => {
      connectionStatus.textContent = "WS closed, retrying...";
      setTimeout(connectSocket, 2500);
    });

    socket.addEventListener("error", () => {
      connectionStatus.textContent = "WS error";
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    setDemoStatus(root, "Launching tanker...", "busy");
    const response = await fetch(`${apiBase}/v1/game/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.get("player"), faction_id: data.get("faction_id") }),
    });
    if (!response.ok) {
      setDemoStatus(root, "Join failed", "error");
      return;
    }
    const payload = await response.json();
    if (payload.error) {
      setDemoStatus(root, payload.error, "error");
      return;
    }
    playerId = payload.player.id;
    try {
      localStorage.setItem("peg-tanker-command-player-id", playerId);
      localStorage.setItem("peg-tanker-command-player-name", String(data.get("player")));
      localStorage.setItem("peg-tanker-command-faction", String(data.get("faction_id")));
    } catch {
      // ignore
    }
    render(payload.state);
    setDemoStatus(root, "Tanker launched", "ok");
  });

  refreshButton?.addEventListener("click", refresh);

  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (["w", "a", "s", "d"].includes(key)) {
      event.preventDefault();
      setControl(key, true);
    }
  });

  document.addEventListener("keyup", (event) => {
    const key = event.key.toLowerCase();
    if (["w", "a", "s", "d"].includes(key)) {
      event.preventDefault();
      setControl(key, false);
    }
  });

  await refresh();
  connectSocket();
  inputTimer = setInterval(() => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "ping" }));
    }
  }, 12000);

  window.addEventListener("beforeunload", () => {
    if (inputTimer) {
      clearInterval(inputTimer);
    }
  }, { once: true });
}

async function loadDemo() {
  if (!demoRoot) {
    return;
  }

  try {
    if (demoRoot.dataset.demo === "astacus-notes") {
      await setupAstacusDemo(demoRoot);
    }
    if (demoRoot.dataset.demo === "session-hub") {
      await setupSessionHubDemo(demoRoot);
    }
    if (demoRoot.dataset.demo === "live-lobby") {
      await setupLiveLobbyDemo(demoRoot);
    }
    if (demoRoot.dataset.demo === "tanker-command") {
      await setupTankerCommandDemo(demoRoot);
    }
  } catch (error) {
    console.error(error);
    setDemoStatus(demoRoot, "Live demo unavailable", "error");
    const list = demoRoot.querySelector("[data-demo-list]");
    if (list) {
      list.innerHTML = '<article class="demo-item"><p>The service is not answering right now. Check the deploy lane.</p></article>';
    }
  }
}

loadProjects();
loadDemo();
