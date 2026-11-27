import { join } from "node:path";
import { esc } from "./html.mjs";
import { lerJson } from "./config.mjs";

export function lerConexoes(raiz) {
  const dados = lerJson(join(raiz, "docs", "CONEXOES.json"), {});
  return {
    nos: Array.isArray(dados.nos) ? dados.nos : [],
    conexoes: Array.isArray(dados.conexoes) ? dados.conexoes : [],
  };
}

export function montarGrafo({ nos = [], conexoes = [], sugeridas = [], repos = [] }) {
  const manuais = conexoes.map((c) => ({ ...c, sugerida: false }));
  const pares = new Set(manuais.map((c) => `${c.de}>${c.para}`));
  const extras = sugeridas.filter((s) => !pares.has(`${s.de}>${s.para}`)).map((s) => ({ ...s, sugerida: true }));
  const arestas = [...manuais, ...extras];
  const ids = new Map();
  const garantir = (id, extra = {}) => {
    if (!ids.has(id)) ids.set(id, { id, nome: id, tipo: "sistema", ...extra });
    else Object.assign(ids.get(id), extra);
  };
  for (const repo of repos) garantir(repo.nome);
  for (const no of nos) garantir(no.id, { nome: no.nome || no.id, tipo: no.tipo || "sistema" });
  for (const aresta of arestas) {
    garantir(aresta.de);
    garantir(aresta.para);
  }
  return { nos: [...ids.values()], arestas };
}

const LARGURA = 168;
const ALTURA = 46;
const FOLGA_X = 150;
const FOLGA_Y = 34;
const MARGEM = 24;

export function camadas(grafo) {
  const camada = new Map(grafo.nos.map((no) => [no.id, 0]));
  for (let volta = 0; volta < grafo.nos.length; volta += 1) {
    let mudou = false;
    for (const aresta of grafo.arestas) {
      if (aresta.de === aresta.para) continue;
      const alvo = camada.get(aresta.de) + 1;
      if (alvo > camada.get(aresta.para) && alvo < grafo.nos.length) {
        camada.set(aresta.para, alvo);
        mudou = true;
      }
    }
    if (!mudou) break;
  }
  return camada;
}

export function posicionar(grafo) {
  const camada = camadas(grafo);
  const colunas = [];
  for (const no of grafo.nos) (colunas[camada.get(no.id)] ??= []).push(no);
  const posicoes = new Map();
  const maior = Math.max(1, ...colunas.map((coluna) => (coluna ? coluna.length : 0)));
  const alturaTotal = maior * ALTURA + (maior - 1) * FOLGA_Y;
  colunas.forEach((coluna, indice) => {
    if (!coluna) return;
    const altura = coluna.length * ALTURA + (coluna.length - 1) * FOLGA_Y;
    const inicio = MARGEM + (alturaTotal - altura) / 2;
    coluna.forEach((no, linha) => {
      posicoes.set(no.id, { x: MARGEM + indice * (LARGURA + FOLGA_X), y: inicio + linha * (ALTURA + FOLGA_Y) });
    });
  });
  const largura = MARGEM * 2 + colunas.length * LARGURA + Math.max(0, colunas.length - 1) * FOLGA_X;
  return { posicoes, largura, altura: alturaTotal + MARGEM * 2 };
}

function cortar(texto, limite) {
  return texto.length > limite ? `${texto.slice(0, limite - 1)}…` : texto;
}

function caminhoDaAresta(a, b) {
  if (a.x < b.x) {
    const x1 = a.x + LARGURA;
    const y1 = a.y + ALTURA / 2;
    const x2 = b.x;
    const y2 = b.y + ALTURA / 2;
    const meio = (x1 + x2) / 2;
    return { d: `M${x1},${y1} C${meio},${y1} ${meio},${y2} ${x2},${y2}`, mx: meio, my: (y1 + y2) / 2 };
  }
  const x1 = a.x + LARGURA / 2;
  const y1 = a.y + ALTURA;
  const x2 = b.x + LARGURA / 2;
  const y2 = b.y + ALTURA;
  const fundo = Math.max(y1, y2) + 36;
  return { d: `M${x1},${y1} C${x1},${fundo} ${x2},${fundo} ${x2},${y2}`, mx: (x1 + x2) / 2, my: fundo - 8 };
}

const ESTILO = `<style>
.cx-no{fill:var(--bg-elev,#fff);stroke:var(--border-strong,#cfd4dc);stroke-width:1.2}
.cx-no.externo{stroke-dasharray:4 3}
.cx-nome{fill:var(--text,#14171c);font:600 13px ui-sans-serif,system-ui,sans-serif}
.cx-tipo{fill:var(--text-3,#7a8392);font:11px ui-sans-serif,system-ui,sans-serif}
.cx-aresta{fill:none;stroke:var(--accent,#2f5bea);stroke-width:1.6}
.cx-aresta.sugerida{stroke:var(--text-3,#7a8392);stroke-dasharray:5 4}
.cx-seta{fill:var(--accent,#2f5bea)}
.cx-fundo{fill:var(--bg,#f6f7f9);opacity:.92}
.cx-rotulo{fill:var(--text-2,#4a5260);font:11px ui-sans-serif,system-ui,sans-serif;text-anchor:middle}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .cx-no{fill:var(--bg-elev,#151a21);stroke:var(--border-strong,#313a47)}
:root:not([data-theme=light]) .cx-nome{fill:var(--text,#e8ebf0)}}
</style>`;

export function gerarSvg(grafo) {
  if (!grafo.nos.length) return "";
  const { posicoes, largura, altura } = posicionar(grafo);
  const partes = [];
  const alturaFinal = altura + 48;
  partes.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largura} ${alturaFinal}" width="${largura}" height="${alturaFinal}" role="img" aria-label="Diagrama de conexões entre sistemas">`,
    ESTILO,
    `<defs><marker id="cx-seta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path class="cx-seta" d="M0,0 L10,5 L0,10 z"/></marker></defs>`,
  );
  for (const aresta of grafo.arestas) {
    const a = posicoes.get(aresta.de);
    const b = posicoes.get(aresta.para);
    if (!a || !b || aresta.de === aresta.para) continue;
    const { d, mx, my } = caminhoDaAresta(a, b);
    const rotulo = [aresta.protocolo, aresta.autenticacao].filter(Boolean).join(" · ");
    partes.push(`<path class="cx-aresta${aresta.sugerida ? " sugerida" : ""}" d="${d}" marker-end="url(#cx-seta)"><title>${esc(aresta.de)} chama ${esc(aresta.para)}${rotulo ? `: ${esc(rotulo)}` : ""}</title></path>`);
    if (rotulo) {
      const texto = cortar(rotulo, 26);
      partes.push(`<rect class="cx-fundo" x="${mx - texto.length * 3.2 - 6}" y="${my - 11}" width="${texto.length * 6.4 + 12}" height="16" rx="4"/>`);
      partes.push(`<text class="cx-rotulo" x="${mx}" y="${my + 1}">${esc(texto)}</text>`);
    }
  }
  for (const no of grafo.nos) {
    const p = posicoes.get(no.id);
    partes.push(
      `<g><rect class="cx-no${no.tipo && no.tipo !== "sistema" ? " externo" : ""}" x="${p.x}" y="${p.y}" width="${LARGURA}" height="${ALTURA}" rx="9"/>`,
      `<text class="cx-nome" x="${p.x + 12}" y="${p.y + 20}">${esc(cortar(no.nome, 20))}</text>`,
      `<text class="cx-tipo" x="${p.x + 12}" y="${p.y + 36}">${esc(no.tipo || "sistema")}</text></g>`,
    );
  }
  partes.push("</svg>");
  return partes.join("\n");
}
