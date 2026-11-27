import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { extname, normalize, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { argumento, lerConfig } from "./config.mjs";
import { carregar } from "./dados.mjs";
import { conexoes, dashboard, itemDoQuadro, naoEncontrada, quadro, sistema, sistemas } from "./paginas.mjs";

const TIPOS = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml" };

function decodificar(caminho) {
  try {
    return caminho.split("/").filter(Boolean).map(decodeURIComponent);
  } catch {
    return null;
  }
}

export function rotear(raiz, caminho) {
  const ctx = carregar(raiz);
  const ok = (html) => ({ status: 200, html });
  const ausente = () => ({ status: 404, html: naoEncontrada(ctx) });
  const partes = decodificar(caminho);
  if (!partes) return ausente();
  if (!partes.length) return ok(dashboard(ctx));
  if (partes[0] === "sistemas") {
    if (partes.length === 1) return ok(sistemas(ctx));
    if (partes[1] === "conexoes") return ok(conexoes(ctx));
    const html = sistema(ctx, partes[1]);
    return html ? ok(html) : ausente();
  }
  if (partes[0] === "quadro") {
    if (partes.length === 1) return ok(quadro(ctx));
    const html = itemDoQuadro(ctx, partes[1]);
    return html ? ok(html) : ausente();
  }
  return ausente();
}

function servirArquivo(raiz, caminho, resposta) {
  const docs = resolve(raiz, "docs");
  let relativo = null;
  try {
    relativo = decodeURIComponent(caminho.replace(/^\/arquivos\//, ""));
  } catch {
    relativo = null;
  }
  const alvo = relativo === null || relativo.includes("\0") ? docs : resolve(docs, normalize(relativo));
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
      const { status, html } = rotear(raiz, url.pathname);
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
  const host = process.argv.includes("--rede") ? "0.0.0.0" : process.env.PAINEL_HOST || config.host;
  const servidor = criarServidor(raiz);
  servidor.listen(porta, host, () => {
    console.log(`[painel] ${config.nome} em http://${host === "0.0.0.0" ? "localhost" : host}:${porta}`);
    if (host === "0.0.0.0") {
      for (const ip of enderecosDaRede()) console.log(`[painel] na rede: http://${ip}:${porta}`);
    } else {
      console.log("[painel] só esta máquina. Para abrir na rede: npm run painel -- --rede (ou PAINEL_HOST=0.0.0.0 no config)");
    }
  });
}
