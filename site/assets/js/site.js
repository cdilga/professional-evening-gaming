const yearTarget = document.querySelector("[data-year]");
const projectGrids = document.querySelectorAll("[data-project-grid]");

if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
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

loadProjects();
