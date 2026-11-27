import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { argumento, lerConfig, listaDeRepos } from "./config.mjs";
import { gerarSvg, lerConexoes, montarGrafo } from "./conexoes-core.mjs";
import { coletarMapa } from "./mapa-core.mjs";

const raiz = resolve(argumento("raiz", process.cwd()));
const config = lerConfig(raiz);
const arquivoMapa = join(raiz, "docs", "painel", "mapa.json");
const mapa = existsSync(arquivoMapa) ? JSON.parse(readFileSync(arquivoMapa, "utf8")) : coletarMapa(listaDeRepos(config, raiz));
const manual = lerConexoes(raiz);
const grafo = montarGrafo({ ...manual, sugeridas: mapa.conexoesSugeridas ?? [], repos: mapa.repos ?? [] });
const svg = gerarSvg(grafo);

if (!svg) {
  console.log("[conexoes] nada a desenhar: preencha docs/CONEXOES.json ou rode npm run mapa");
} else {
  mkdirSync(join(raiz, "docs", "painel"), { recursive: true });
  writeFileSync(join(raiz, "docs", "painel", "conexoes.svg"), `${svg}\n`, "utf8");
  console.log(`[conexoes] ${grafo.nos.length} sistemas, ${grafo.arestas.length} ligações em docs/painel/conexoes.svg`);
}
