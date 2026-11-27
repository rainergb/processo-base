import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { argumento, lerConfig, listaDeRepos } from "./config.mjs";
import { coletarMapa } from "./mapa-core.mjs";

const raiz = resolve(argumento("raiz", process.cwd()));
const config = lerConfig(raiz);
const mapa = coletarMapa(listaDeRepos(config, raiz));

const pasta = join(raiz, "docs", "painel");
mkdirSync(pasta, { recursive: true });
writeFileSync(join(pasta, "mapa.json"), `${JSON.stringify(mapa, null, 2)}\n`, "utf8");

for (const repo of mapa.repos) {
  if (!repo.existe) {
    console.log(`[mapa] ${repo.nome}: pasta não encontrada (${repo.caminho})`);
    continue;
  }
  const stack = repo.stack.map((s) => `${s.nome} ${s.versao}`.trim()).join(", ") || "stack não detectada";
  console.log(`[mapa] ${repo.nome}: ${stack}; ${repo.arquivos} arquivos, ${repo.commits} commits`);
}
console.log("[mapa] gravado em docs/painel/mapa.json (nunca lê .env, só .env.example)");
