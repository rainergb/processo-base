// Cria um projeto de exemplo (fictício) com 3 repositórios e dados do painel.
//   node scripts/exemplo-painel.mjs [--caminho <pasta>]   (padrão: exemplos/painel-demo, fora do git)
// Depois: cd <pasta>/projeto, copie nucleo/scripts/painel para scripts/painel (ou rode o sync) e use npm run mapa e npm run painel.
import { cpSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { criarExemplo } from "./exemplo-core.mjs";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const indice = process.argv.indexOf("--caminho");
const base = resolve(indice !== -1 ? process.argv[indice + 1] : join(raiz, "exemplos", "painel-demo"));

rmSync(base, { recursive: true, force: true });
const { projeto } = criarExemplo(base);
cpSync(join(raiz, "nucleo", "scripts", "painel"), join(projeto, "scripts", "painel"), { recursive: true });
console.log(`[exemplo] criado em ${base}`);
console.log(`[exemplo] cd "${projeto}" && node scripts/painel/mapa.mjs && node scripts/painel/painel.mjs`);
