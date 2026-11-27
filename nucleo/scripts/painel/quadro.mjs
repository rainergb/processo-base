import { join } from "node:path";
import { slug } from "./html.mjs";
import { lerJson } from "./config.mjs";

const ESTADOS = { feito: "feito", x: "feito", parcial: "parcial", pendente: "pendente" };

export function parseDescricao(texto) {
  const resultado = {};
  let atual = "descricao";
  resultado[atual] = [];
  for (const linha of String(texto ?? "").replace(/\r\n/g, "\n").split("\n")) {
    const negrito = linha.match(/^\*\*([^*]+?)\*\*:?\s*(.*)$/);
    const titulo = linha.match(/^#{1,4}\s+(.+?)\s*$/);
    if (negrito && negrito[1].trim().split(/\s+/).length <= 4) {
      atual = slug(negrito[1]);
      resultado[atual] = negrito[2] ? [negrito[2]] : [];
    } else if (titulo) {
      atual = slug(titulo[1]);
      resultado[atual] = [];
    } else {
      (resultado[atual] ??= []).push(linha);
    }
  }
  const saida = {};
  for (const [chave, linhas] of Object.entries(resultado)) saida[chave] = linhas.join("\n").trim();
  return saida;
}

export function criteriosDoTexto(texto) {
  return String(texto ?? "")
    .split("\n")
    .map((linha) => linha.match(/^\s*(?:[-*]|\d+\.)\s+(?:\[([^\]]?)\]\s*)?(.*\S)\s*$/))
    .filter(Boolean)
    .map(([, marca, conteudo]) => ({
      texto: conteudo,
      estado: marca === undefined ? "pendente" : /^[xX]$/.test(marca) ? "feito" : /^[~/-]$/.test(marca) ? "parcial" : "pendente",
    }));
}

function normalizarEstado(valor) {
  return ESTADOS[String(valor ?? "").toLowerCase()] ?? "pendente";
}

function textoOuObjeto(entrada, campo) {
  return typeof entrada === "string" ? { [campo]: entrada } : entrada;
}

export function normalizarItem(item, prefixo) {
  const secoes = parseDescricao(item.description);
  const criterios = Array.isArray(item.criterios)
    ? item.criterios.map((c) => ({ texto: c.texto, estado: normalizarEstado(c.estado) }))
    : criteriosDoTexto(secoes["pronto-quando"]);
  const resumo = { feito: 0, parcial: 0, pendente: 0, total: criterios.length };
  for (const c of criterios) resumo[c.estado] += 1;
  const linhaDoTempo = [
    ...(item.createdAt ? [{ data: item.createdAt, texto: "Item criado" }] : []),
    ...(Array.isArray(item.linhaDoTempo) ? item.linhaDoTempo : []),
    ...(item.updatedAt && item.updatedAt !== item.createdAt ? [{ data: item.updatedAt, texto: `Última atualização (situação ${item.status})` }] : []),
  ].sort((a, b) => String(a.data).localeCompare(String(b.data)));
  return {
    ...item,
    codigo: `${prefixo}-${item.ref}`,
    problema: secoes.problema || secoes.descricao || "",
    arquivos: secoes.arquivos || "",
    criterios,
    resumo,
    decisoes: Array.isArray(item.decisoes) ? item.decisoes.map((d) => textoOuObjeto(d, "texto")) : [],
    decisoesTexto: secoes.decisoes || "",
    prs: Array.isArray(item.prs) ? item.prs.map(String) : [],
    prints: Array.isArray(item.prints) ? item.prints.map((p) => textoOuObjeto(p, "arquivo")) : [],
    veredito: item.veredito && typeof item.veredito === "object" ? item.veredito : null,
    achadosExtras: Array.isArray(item.achadosExtras) ? item.achadosExtras.map((a) => textoOuObjeto(a, "titulo")) : [],
    achadosExtrasTexto: secoes["achados-extras"] || "",
    textoSugerido: Array.isArray(item.textoSugerido) ? item.textoSugerido : [],
    linhaDoTempo,
  };
}

const PRIORIDADES = ["alta", "media", "baixa"];

export function lerQuadro(raiz, config) {
  const quadro = lerJson(join(raiz, "docs", "backlog.json"), { prefix: config.prefixo, items: [] });
  const prefixo = quadro.prefix || config.prefixo;
  const itens = (quadro.items || []).map((item) => normalizarItem(item, prefixo));
  const conhecidas = new Set(config.situacoes.map((s) => s.id));
  const situacoes = config.situacoes.map((situacao) => ({
    ...situacao,
    itens: itens
      .filter((item) => item.status === situacao.id)
      .sort((a, b) => PRIORIDADES.indexOf(a.priority) - PRIORIDADES.indexOf(b.priority) || a.ref - b.ref),
  }));
  const orfaos = itens.filter((item) => !conhecidas.has(item.status));
  if (orfaos.length) situacoes.push({ id: "outras", nome: "Outras", aberta: true, papel: "", itens: orfaos });
  return { prefixo, itens, situacoes };
}
