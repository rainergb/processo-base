// Renderiza tudo o que esta em nucleo/ em cada projeto, no mesmo caminho relativo.
// (nucleo/CLAUDE.md vira <projeto>/CLAUDE.md, nucleo/.claude/skills/... vira <projeto>/.claude/skills/...).
//
//   npm run sync                      escreve em todos os projetos do projetos.json
//   npm run sync:check                nao escreve; sai com codigo 1 se algum projeto divergiu
//   npm run sync -- --only=meu-app    limita a um projeto (nome em projetos.json)
//   npm run sync -- --project /caminho  renderiza so esse projeto, lendo o config dele
//
// Formato do projetos.json (lista pessoal, nao commitado):
//   { "nome": "caminho/absoluto/do/projeto" }
//
// Formato do docs/processo/config.json do projeto:
//   { "name": "nome-do-projeto", "vars": { ... } }
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveVars } from "./novo-core.mjs";
import { listTemplates, outputsFor } from "./outputs.mjs";
import { render } from "./render.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const NUCLEO = join(ROOT, "nucleo");
const check = process.argv.includes("--check");

const templates = listTemplates(NUCLEO);
let diverged = 0;

function normalize(text) {
  // CRLF do checkout no Windows nao conta como divergencia.
  return text.replace(/\r\n/g, "\n");
}

function sync(name, target, next) {
  const current = existsSync(target) ? normalize(readFileSync(target, "utf8")) : null;
  if (current === next) return;
  if (check) {
    console.error(`[sync] ${name}: ${target} divergiu`);
    diverged += 1;
    return;
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, next, "utf8");
  console.log(`[sync] ${name}: ${target} atualizado`);
}

// Lê config do projeto a partir do docs/processo/config.json
function readProjectConfig(projectPath) {
  const configFile = join(projectPath, "docs", "processo", "config.json");
  if (!existsSync(configFile)) {
    throw new Error(
      `[sync] config nao encontrado: ${configFile}. Crie com --project ou com 'node scripts/novo.mjs'.`,
    );
  }
  return JSON.parse(readFileSync(configFile, "utf8"));
}

function syncProject(name, projectPath) {
  if (!existsSync(projectPath)) {
    console.error(`[sync] ${name}: pasta nao existe (${projectPath})`);
    process.exitCode = 2;
    return;
  }
  const config = readProjectConfig(projectPath);
  const vars = resolveVars(config.vars);
  for (const file of outputsFor(templates, vars)) {
    const template = normalize(readFileSync(join(NUCLEO, file), "utf8"));
    sync(name, join(projectPath, file), render(template, vars));
  }
}

// --project <caminho>: renderiza so esse projeto, lendo o config dele
const projectArg = (() => {
  const idx = process.argv.indexOf("--project");
  return idx !== -1 ? resolve(process.argv[idx + 1]) : null;
})();

if (projectArg) {
  const config = readProjectConfig(projectArg);
  syncProject(config.name || projectArg, projectArg);
  if (check && diverged > 0) process.exit(1);
  if (!process.exitCode) console.log(check ? "[sync] tudo em dia" : "[sync] concluido");
  process.exit(process.exitCode || 0);
}

// Sem --project: percorre projetos.json (lista pessoal { "nome": "caminho" })
const projectsFile = join(ROOT, "projetos.json");
if (!existsSync(projectsFile)) {
  if (check) {
    console.log("[sync] sem projetos.json: nada a conferir (use --project <caminho> para um projeto avulso)");
    process.exit(0);
  }
  console.error(
    "[sync] projetos.json nao encontrado. Crie-o com base em projetos.exemplo.json ou use --project <caminho>.",
  );
  process.exit(1);
}

const projects = JSON.parse(readFileSync(projectsFile, "utf8"));

// --only=nome: limita a um projeto
const only = process.argv.find((arg) => arg.startsWith("--only="))?.slice("--only=".length);

for (const [name, projectPath] of Object.entries(projects)) {
  if (only && name !== only) continue;
  syncProject(name, String(projectPath));
}

if (check && diverged > 0) process.exit(1);
if (!process.exitCode) console.log(check ? "[sync] tudo em dia" : "[sync] concluido");
