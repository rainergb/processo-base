// Variáveis padrão de um projeto novo. Tudo que é opcional nasce desligado; ligue no
// docs/processo/config.json quando o projeto tiver e2e, design system ou regra de comentário.

const S = (id, nome, aberta = true, papel = "") => ({ id, nome, aberta, papel });

// Situações do quadro antes da 0.2. Config sem SITUACOES continua com elas.
export const SITUACOES_CLASSICAS = [
  S("doing", "Em andamento", true, "andamento"),
  S("testing", "Testes", true, "teste"),
  S("todo", "A fazer", true, "fila"),
  S("idea", "Ideia"),
  S("done", "Feito", false, "feito"),
  S("dropped", "Descartado", false),
];

export const SITUACOES_PADRAO = [
  S("proposta", "Proposta", true, "fila"),
  S("desenvolvimento", "Em desenvolvimento", true, "andamento"),
  S("revisao", "Em revisão"),
  S("teste", "Em teste", true, "teste"),
  S("testado", "Testado"),
  S("commitado", "Commitado"),
  S("mergeado", "Mergeado", true, "feito"),
  S("finalizado", "Finalizado", false),
  S("descartado", "Descartado", false),
];

// Valores de quem ainda não tem a chave no config.json: o comportamento de antes da 0.2.
export const LEGACY_DEFAULTS = {
  SITUACOES: SITUACOES_CLASSICAS,
  POS_DEPLOY: false,
  MERGE_POLICY: "lider",
  PUSH_POLICY: "lote",
  COMMIT_STYLE: "prefixo",
  TESTER_SCOPE: "alta",
  REPOS: [],
  PAINEL: false,
  PAINEL_PORT: 3340,
  PAINEL_HOST: "127.0.0.1",
};

const CHOICES = {
  MERGE_POLICY: ["lider", "dono"],
  PUSH_POLICY: ["lote", "dono"],
  COMMIT_STYLE: ["prefixo", "conventional"],
  TESTER_SCOPE: ["alta", "todas"],
};

function idDo(situacoes, papel, fallback) {
  return situacoes.find((s) => s.papel === papel)?.id ?? fallback;
}

// Completa o config do projeto com os padrões antigos e calcula as variáveis derivadas
// (booleanas para os blocos {{#if}} e textos montados). É o que o sync usa.
export function resolveVars(raw) {
  const vars = { ...LEGACY_DEFAULTS, ...raw };
  for (const [key, allowed] of Object.entries(CHOICES)) {
    if (!allowed.includes(vars[key])) throw new Error(`${key} inválido: ${vars[key]} (use ${allowed.join(" ou ")})`);
  }
  if (!Array.isArray(vars.REPOS)) throw new Error("REPOS deve ser uma lista de { nome, caminho }");
  for (const repo of vars.REPOS) {
    if (!repo || typeof repo.nome !== "string" || typeof repo.caminho !== "string") {
      throw new Error("REPOS: cada item precisa de nome e caminho (texto)");
    }
  }
  const situacoes = vars.SITUACOES;
  const ordem = situacoes.map((s) => s.id);
  if (new Set(ordem).size !== ordem.length) throw new Error("SITUACOES com id repetido");
  const tick = "`";
  return {
    ...vars,
    MERGE_DONO: vars.MERGE_POLICY === "dono",
    PUSH_DONO: vars.PUSH_POLICY === "dono",
    COMMIT_CONVENTIONAL: vars.COMMIT_STYLE === "conventional",
    TESTER_TODAS: vars.TESTER_SCOPE === "todas",
    PUSH_OK_DONO: vars.MERGE_POLICY === "dono" || vars.PUSH_POLICY === "dono",
    FLUXO_LOTE: vars.MERGE_POLICY !== "dono" && vars.PUSH_POLICY !== "dono",
    FLUXO_SIMPLES: vars.MERGE_POLICY !== "dono" && vars.PUSH_POLICY === "dono",
    MULTI_REPO: vars.REPOS.length > 0,
    REPOS_TEXTO: vars.REPOS.map((r) => `${tick}${r.nome}${tick} (${tick}${r.caminho}${tick})`).join(", "),
    SITUACOES_IDS_JSON: JSON.stringify(ordem),
    SITUACOES_ABERTAS_JSON: JSON.stringify(situacoes.filter((s) => s.aberta).map((s) => s.id)),
    SITUACOES_TEXTO: situacoes.map((s) => `${tick}${s.id}${tick} ${s.nome}`).join(", "),
    ST_FILA: idDo(situacoes, "fila", ordem[0]),
    ST_ANDAMENTO: idDo(situacoes, "andamento", ordem[0]),
    ST_TESTE: idDo(situacoes, "teste", ordem[0]),
    ST_FEITO: idDo(situacoes, "feito", ordem[0]),
  };
}

export function defaultVars({ nome, prefixo, dono }) {
  if (!/^[a-z0-9-]+$/.test(nome)) throw new Error(`nome inválido: ${nome} (use minúsculas, números e hífen)`);
  if (!/^[A-Z]{1,3}$/.test(prefixo)) throw new Error(`prefixo inválido: ${prefixo} (1 a 3 letras maiúsculas)`);
  if (!dono) throw new Error("dono obrigatório: passe --dono <nome>");
  const P = prefixo;
  return {
    OWNER: dono,
    PROJECT_NAME: nome,
    NO_EM_DASH: false,
    WRITING_LANGS: "Código e nomes em inglês, comentários e docs em português.",
    PREFIX: P,
    PREFIX_LOWER: P.toLowerCase(),
    AGENT_CAP: 2,
    CHECK_CMD: "`npm run check`",
    CHECK_LABEL: "npm run check",
    HANDOFF_PATH: "docs/HANDOFF.md",
    PURE_LOGIC_DIR: "src/lib",
    SRC_ROOT: "src/",
    DECISIONS_WHERE: "`docs/DECISOES.md`",
    E2E: false,
    SEARCH_FIRST: false,
    DESIGN_APPROVAL: false,
    NO_UI_COMMENTS: false,
    BOARD_DESCRIPTION: "Arquivo `docs/backlog.json`, lido e gravado pelos scripts da raiz:",
    BOARD_COMMANDS: [
      "npm run backlog                 # lista o que está aberto",
      `npm run backlog -- ${P}-3        # mostra um item`,
      'npm run backlog:add -- --title "..." --priority alta --area x',
      "npm run backlog:add -- --update " + `${P}-3 --status desenvolvimento`,
    ].join("\n"),
    BOARD_ONE_CMD: `npm run backlog -- ${P}-12`,
    BOARD_LIST_CMD: "npm run backlog",
    BOARD_SET_STATUS: `\`npm run backlog:add -- --update ${P}-N --status desenvolvimento\``,
    BOARD_LINK: "",
    LEADER_MODEL: false,
    ARCH_DOC: "docs/ARQUITETURA.md",
    DECISIONS_DOC: "docs/DECISOES.md",
    DECISIONS_DOC_NAME: "DECISOES.md",
    DOMAIN_TERM: "domínio",
    MODULE_EXAMPLES: "um arquivo em `src/lib/`, uma rota de API, um componente com estado próprio.",
    INVARIANTS_EXAMPLE: "uma regra que o `AGENTS.md` dá como invariante",
    LOCALITY_EXAMPLE: "",
    SITUACOES: SITUACOES_PADRAO,
    POS_DEPLOY: true,
    MERGE_POLICY: "lider",
    PUSH_POLICY: "lote",
    COMMIT_STYLE: "prefixo",
    TESTER_SCOPE: "alta",
    REPOS: [],
    PAINEL: true,
    PAINEL_PORT: 3340,
    PAINEL_HOST: "127.0.0.1",
  };
}

// Scripts do quadro local e do painel que entram no package.json do projeto, sem sobrescrever os que existem.
export function withBoardScripts(pkg, { painel = false } = {}) {
  const extra = painel
    ? {
        mapa: "node scripts/painel/mapa.mjs",
        painel: "node scripts/painel/painel.mjs",
        conexoes: "node scripts/painel/conexoes.mjs",
      }
    : {};
  const scripts = { backlog: "node scripts/backlog.mjs", "backlog:add": "node scripts/backlog-add.mjs", ...extra, ...pkg.scripts };
  return { ...pkg, scripts };
}

// "nome=caminho,nome2=caminho2" vira [{ nome, caminho }].
export function parseRepos(text) {
  return String(text)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [nome, ...resto] = part.split("=");
      const caminho = resto.join("=").trim();
      if (!nome.trim() || !caminho) throw new Error(`repos inválido: "${part}" (use nome=caminho)`);
      return { nome: nome.trim(), caminho };
    });
}
