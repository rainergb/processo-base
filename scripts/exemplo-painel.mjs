// Cria um projeto de exemplo (fictício) com 3 repositórios e dados do painel.
//   node scripts/exemplo-painel.mjs [--caminho <pasta>]   (padrão: exemplos/painel-demo, fora do git)
// Depois: cd <pasta>/projeto && node scripts/painel/mapa.mjs && node scripts/painel/painel.mjs
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { criarExemplo } from "./exemplo-core.mjs";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const indice = process.argv.indexOf("--caminho");
const base = resolve(indice !== -1 ? process.argv[indice + 1] : join(raiz, "exemplos", "painel-demo"));

rmSync(base, { recursive: true, force: true });
const { projeto } = criarExemplo(base);
execFileSync(process.execPath, [join(raiz, "scripts", "sync.mjs"), "--project", projeto], { stdio: "ignore" });
console.log(`[exemplo] criado em ${base}`);
console.log(`[exemplo] cd "${projeto}" && node scripts/painel/mapa.mjs && node scripts/painel/painel.mjs`);
