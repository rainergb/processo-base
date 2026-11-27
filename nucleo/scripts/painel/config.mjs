import { existsSync, readFileSync } from "node:fs";
import { basename, isAbsolute, join, resolve } from "node:path";

export const SITUACOES_CLASSICAS = [
  { id: "doing", nome: "Em andamento", aberta: true, papel: "andamento" },
  { id: "testing", nome: "Testes", aberta: true, papel: "teste" },
  { id: "todo", nome: "A fazer", aberta: true, papel: "fila" },
  { id: "idea", nome: "Ideia", aberta: true, papel: "" },
  { id: "done", nome: "Feito", aberta: false, papel: "feito" },
  { id: "dropped", nome: "Descartado", aberta: false, papel: "" },
];

export function lerJson(arquivo, padrao) {
  if (!existsSync(arquivo)) return padrao;
  try {
    return JSON.parse(readFileSync(arquivo, "utf8"));
  } catch {
    return padrao;
  }
}

export function lerConfig(raiz) {
  const cfg = lerJson(join(raiz, "docs", "processo", "config.json"), {});
  const vars = cfg.vars || {};
  const situacoes = Array.isArray(vars.SITUACOES) && vars.SITUACOES.length ? vars.SITUACOES : SITUACOES_CLASSICAS;
  return {
    nome: cfg.name || vars.PROJECT_NAME || basename(resolve(raiz)),
    prefixo: vars.PREFIX || "P",
    dono: vars.OWNER || "",
    situacoes,
    repos: Array.isArray(vars.REPOS) ? vars.REPOS : [],
    porta: Number(vars.PAINEL_PORT) || 3340,
    handoff: vars.HANDOFF_PATH || "docs/HANDOFF.md",
  };
}

export function listaDeRepos(config, raiz) {
  const base = config.repos.length ? config.repos : [{ nome: config.nome, caminho: "." }];
  return base.map((repo) => ({
    nome: repo.nome,
    caminho: repo.caminho,
    absoluto: isAbsolute(repo.caminho) ? repo.caminho : resolve(raiz, repo.caminho),
  }));
}

export function argumento(nome, padrao) {
  const indice = process.argv.indexOf(`--${nome}`);
  return indice !== -1 && process.argv[indice + 1] ? process.argv[indice + 1] : padrao;
}
