import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { slug } from "./html.mjs";

export function secoes(texto) {
  const mapa = {};
  let atual = "_inicio";
  mapa[atual] = [];
  for (const linha of String(texto).replace(/\r\n/g, "\n").split("\n")) {
    const titulo = linha.match(/^##\s+(.+?)\s*$/);
    if (titulo) {
      atual = slug(titulo[1]);
      mapa[atual] = [];
    } else {
      mapa[atual].push(linha);
    }
  }
  return mapa;
}

function topicos(linhas) {
  return linhas
    .map((linha) => linha.match(/^\s*(?:[-*]|\d+\.)\s+(.*\S)\s*$/)?.[1])
    .filter((texto) => texto && !/^<.*>$/.test(texto));
}

function procurar(mapa, prefixo) {
  const chave = Object.keys(mapa).find((nome) => nome.startsWith(prefixo));
  return chave ? mapa[chave] : [];
}

export function lerHandoff(raiz, caminho = "docs/HANDOFF.md") {
  const arquivo = join(raiz, caminho);
  if (!existsSync(arquivo)) return { existe: false, titulo: "", proximoPasso: "", pendencias: [], emAndamento: [] };
  const texto = readFileSync(arquivo, "utf8");
  const mapa = secoes(texto);
  const titulo = texto.match(/^#\s+(.+)$/m)?.[1] ?? "";
  const proximoPasso = procurar(mapa, "proximo-passo").join("\n").trim();
  return {
    existe: true,
    titulo,
    proximoPasso,
    pendencias: topicos(procurar(mapa, "pendencias")),
    emAndamento: topicos(procurar(mapa, "em-andamento")),
  };
}

export function lerDecisoes(raiz, limite = 6) {
  const arquivo = join(raiz, "docs", "DECISOES.md");
  if (!existsSync(arquivo)) return [];
  const linhas = readFileSync(arquivo, "utf8").replace(/\r\n/g, "\n").split("\n");
  const itens = topicos(linhas);
  return itens.slice(-limite).reverse();
}
