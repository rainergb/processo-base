import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { extname, normalize, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { argumento, lerConfig } from "./config.mjs";
import { carregar } from "./dados.mjs";
import { conexoes, dashboard, itemDoQuadro, naoEncontrada, quadro, sistema, sistemas } from "./paginas.mjs";

const TIPOS = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml" };

export function rotear(raiz, caminho) {
  const ctx = carregar(raiz);
  const partes = caminho.split("/").filter(Boolean).map(decodeURIComponent);
  if (!partes.length) return dashboard(ctx);
  if (partes[0] === "sistemas") {
    if (partes.length === 1) return sistemas(ctx);
    if (partes[1] === "conexoes") return conexoes(ctx);
    return sistema(ctx, partes[1]) ?? naoEncontrada(ctx);
  }
  if (partes[0] === "quadro") {
    if (partes.length === 1) return quadro(ctx);
    return itemDoQuadro(ctx, partes[1]) ?? naoEncontrada(ctx);
  }
  return naoEncontrada(ctx);
}

function servirArquivo(raiz, caminho, resposta) {
  const docs = resolve(raiz, "docs");
  const relativo = decodeURIComponent(caminho.replace(/^\/arquivos\//, ""));
  const alvo = resolve(docs, normalize(relativo));
  const tipo = TIPOS[extname(alvo).toLowerCase()];
  if (!alvo.startsWith(docs + sep) || !tipo || !existsSync(alvo) || !statSync(alvo).isFile()) {
    resposta.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    resposta.end("não encontrado");
    return;
  }
  resposta.writeHead(200, { "content-type": tipo, "cache-control": "no-store" });
  resposta.end(readFileSync(alvo));
}

export function criarServidor(raiz) {
  return createServer((pedido, resposta) => {
    try {
      const url = new URL(pedido.url, "http://painel.local");
      if (url.pathname.startsWith("/arquivos/")) return servirArquivo(raiz, url.pathname, resposta);
      const html = rotear(raiz, url.pathname);
      const status = html.includes("Página não encontrada") ? 404 : 200;
      resposta.writeHead(status, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      resposta.end(html);
    } catch (erro) {
      resposta.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      resposta.end(`erro ao montar a página: ${erro.message}`);
    }
  });
}

function enderecosDaRede() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === "IPv4" && !i.internal)
    .map((i) => i.address);
}

const executadoDireto = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (executadoDireto) {
  const raiz = resolve(argumento("raiz", process.cwd()));
  const config = lerConfig(raiz);
  const porta = Number(argumento("porta", process.env.PORT || config.porta));
  const servidor = criarServidor(raiz);
  servidor.listen(porta, "0.0.0.0", () => {
    console.log(`[painel] ${config.nome} em http://localhost:${porta}`);
    for (const ip of enderecosDaRede()) console.log(`[painel] na rede: http://${ip}:${porta}`);
  });
}
