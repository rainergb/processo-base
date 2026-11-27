// Uso único: migra o projetos.json do formato antigo ({ nome: { path, vars } }) para o atual
// ({ nome: caminho }) e escreve docs/processo/config.json em cada projeto.
//
//   node scripts/migrar-config.mjs --entrada antigo.json --saida projetos.json --dono "Seu Nome" [--sem-travessao]
//   ... --dry-run               só mostra o que faria
//   ... --config-dir <pasta>    grava os configs em <pasta>/<nome>.json em vez dos projetos (teste)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { migrateProjects } from "./migrar-core.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const options = {};
for (let i = 0; i < argv.length; i += 1) {
  if (!argv[i].startsWith("--")) continue;
  const next = argv[i + 1];
  if (next === undefined || next.startsWith("--")) options[argv[i].slice(2)] = true;
  else {
    options[argv[i].slice(2)] = next;
    i += 1;
  }
}

const entrada = resolve(options.entrada || join(ROOT, "projetos.json"));
if (!existsSync(entrada)) {
  console.error(`[migrar] arquivo não encontrado: ${entrada}`);
  process.exit(1);
}

const dryRun = Boolean(options["dry-run"]);
const configDir = options["config-dir"] ? resolve(options["config-dir"]) : null;
let result;
try {
  result = migrateProjects(JSON.parse(readFileSync(entrada, "utf8")), {
    dono: typeof options.dono === "string" ? options.dono : "",
    semTravessao: Boolean(options["sem-travessao"]),
  });
} catch (error) {
  console.error(`[migrar] ${error.message}`);
  process.exit(1);
}

function write(file, data) {
  if (dryRun) {
    console.log(`[migrar] [dry-run] ${file}:\n${JSON.stringify(data, null, 2)}`);
    return;
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`[migrar] escrito: ${file}`);
}

for (const [nome, config] of Object.entries(result.configs)) {
  const file = configDir
    ? join(configDir, `${nome}.json`)
    : join(result.projects[nome], "docs", "processo", "config.json");
  write(file, config);
}

if (options.saida) write(resolve(options.saida), result.projects);
else console.log(`[migrar] projetos.json novo (passe --saida para gravar):\n${JSON.stringify(result.projects, null, 2)}`);
