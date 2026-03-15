import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const siteRoot = path.join(repoRoot, "site");
const projectsRoot = path.join(repoRoot, "projects");
const distRoot = path.join(repoRoot, "dist");
const validateOnly = process.argv.includes("--validate-only");

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function getProjectDirectories() {
  return readdirSync(projectsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
    .map((entry) => entry.name)
    .sort();
}

function validateProject(config, dirName) {
  const required = ["slug", "name", "summary", "tagline", "status", "featured", "order", "links", "stack"];
  for (const field of required) {
    if (!(field in config)) {
      throw new Error(`projects/${dirName}/peg-project.json is missing '${field}'`);
    }
  }

  if (config.slug !== dirName) {
    throw new Error(`projects/${dirName}/peg-project.json slug must match directory name`);
  }

  if (!config.links.page || !config.links.repoPath) {
    throw new Error(`projects/${dirName}/peg-project.json needs links.page and links.repoPath`);
  }

  const repoPath = path.join(repoRoot, config.links.repoPath);
  if (!existsSync(repoPath)) {
    throw new Error(`projects/${dirName}/peg-project.json repoPath does not exist: ${config.links.repoPath}`);
  }

  if (config.links.page.startsWith("/projects/")) {
    const relativePagePath = config.links.page.replace(/^\//, "");
    const pagePath = path.join(siteRoot, relativePagePath, "index.html");
    if (!existsSync(pagePath)) {
      throw new Error(`projects/${dirName}/peg-project.json page does not exist in site/: ${relativePagePath}/index.html`);
    }
  }

  if (!config.stack.frontend || !config.stack.deploy) {
    throw new Error(`projects/${dirName}/peg-project.json needs stack.frontend and stack.deploy`);
  }

  if (config.deployment) {
    const deploymentRequired = ["workflow", "composePath", "healthcheck"];
    for (const field of deploymentRequired) {
      if (!(field in config.deployment)) {
        throw new Error(`projects/${dirName}/peg-project.json deployment is missing '${field}'`);
      }
    }

    const workflowPath = path.join(repoRoot, config.deployment.workflow);
    const composePath = path.join(repoRoot, config.deployment.composePath);
    if (!existsSync(workflowPath)) {
      throw new Error(`projects/${dirName}/peg-project.json workflow does not exist: ${config.deployment.workflow}`);
    }
    if (!existsSync(composePath)) {
      throw new Error(`projects/${dirName}/peg-project.json composePath does not exist: ${config.deployment.composePath}`);
    }
  }
}

function collectProjects() {
  return getProjectDirectories()
    .map((dirName) => {
      const configPath = path.join(projectsRoot, dirName, "peg-project.json");
      if (!existsSync(configPath)) {
        throw new Error(`Missing project contract: projects/${dirName}/peg-project.json`);
      }

      const config = readJson(configPath);
      validateProject(config, dirName);
      return config;
    })
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

function build() {
  const projects = collectProjects();

  if (validateOnly) {
    console.log(`Validated ${projects.length} project contract(s).`);
    return;
  }

  rmSync(distRoot, { recursive: true, force: true });
  mkdirSync(distRoot, { recursive: true });
  cpSync(siteRoot, distRoot, { recursive: true });
  cpSync(path.join(repoRoot, "CNAME"), path.join(distRoot, "CNAME"));
  mkdirSync(path.join(distRoot, "data"), { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    projects,
  };

  writeFileSync(path.join(distRoot, "data", "projects.json"), `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Built site to ${distRoot}`);
}

build();
