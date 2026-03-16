const yearTarget = document.querySelector("[data-year]");
const projectGrids = document.querySelectorAll("[data-project-grid]");
const demoRoot = document.querySelector("[data-demo]");

if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

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
    return `<li data-ready="${indicator}">${escapeHtml(player.name)} <small>(${indicator})</small></li>`;
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
  const form = root.querySelector("[data-demo-form]");
  const list = root.querySelector("[data-demo-list]");
  const refreshButton = root.querySelector("[data-demo-refresh]");
  const wsButton = root.querySelector("[data-demo-ws]");
  let websocketStatus = "not connected";
  let liveSocket = null;

  function renderState(state) {
    list.innerHTML = renderLobbyState(state || {}, websocketStatus);
  }

  async function refresh() {
    const [healthResponse, lobbyResponse] = await Promise.all([
      fetch(`${apiBase}/health`),
      fetch(`${apiBase}/v1/lobby`),
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
    setDemoStatus(root, "Sending ready check...", "busy");
    const response = await fetch(`${apiBase}/v1/lobby/ready`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player: data.get("player") }),
    });
    if (!response.ok) {
      setDemoStatus(root, "Could not update lobby", "error");
      return;
    }
    form.reset();
  });

  refreshButton?.addEventListener("click", refresh);
  wsButton?.addEventListener("click", () => {
    if (liveSocket && liveSocket.readyState === WebSocket.OPEN) {
      liveSocket.send(JSON.stringify({ type: "ping" }));
      setDemoStatus(root, "Ping sent", "busy");
    } else {
      setDemoStatus(root, "WebSocket not connected", "error");
    }
  });

  await refresh();
  connectSocket();
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
