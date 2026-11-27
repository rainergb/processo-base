// Variáveis padrão de um projeto novo. Tudo que é opcional nasce desligado; ligue no
// docs/processo/config.json quando o projeto tiver e2e, design system ou regra de comentário.

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
      `npm run backlog:add -- --update ${P}-3 --status doing`,
    ].join("\n"),
    BOARD_ONE_CMD: `npm run backlog -- ${P}-12`,
    BOARD_LIST_CMD: "npm run backlog",
    BOARD_SET_STATUS: `\`npm run backlog:add -- --update ${P}-N --status doing\``,
    BOARD_LINK: "",
    LEADER_MODEL: false,
    ARCH_DOC: "docs/ARQUITETURA.md",
    DECISIONS_DOC: "docs/DECISOES.md",
    DECISIONS_DOC_NAME: "DECISOES.md",
    DOMAIN_TERM: "domínio",
    MODULE_EXAMPLES: "um arquivo em `src/lib/`, uma rota de API, um componente com estado próprio.",
    INVARIANTS_EXAMPLE: "uma regra que o `AGENTS.md` dá como invariante",
    LOCALITY_EXAMPLE: "",
  };
}

// Scripts do quadro local que entram no package.json do projeto, sem sobrescrever os que existem.
export function withBoardScripts(pkg) {
  const scripts = { backlog: "node scripts/backlog.mjs", "backlog:add": "node scripts/backlog-add.mjs", ...pkg.scripts };
  return { ...pkg, scripts };
}
