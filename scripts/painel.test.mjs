import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { criarExemplo } from "./exemplo-core.mjs";
import { defaultVars, resolveVars, SITUACOES_CLASSICAS } from "./novo-core.mjs";
import { listTemplates, outputsFor } from "./outputs.mjs";
import { render } from "./render.mjs";
import * as configPainel from "../nucleo/scripts/painel/config.mjs";
import { gerarSvg, montarGrafo, posicionar } from "../nucleo/scripts/painel/conexoes-core.mjs";
import { lerHandoff } from "../nucleo/scripts/painel/handoff.mjs";
import { coletarMapa, coletarRepo, lerAmbienteTs, lerEnvExemplo, lerMainTs, sugerirConexoes } from "../nucleo/scripts/painel/mapa-core.mjs";
import { rotear } from "../nucleo/scripts/painel/painel.mjs";
import { criteriosDoTexto, lerQuadro, parseDescricao } from "../nucleo/scripts/painel/quadro.mjs";

const NUCLEO = join(import.meta.dirname, "..", "nucleo");

function temporario() {
  return mkdtempSync(join(tmpdir(), "painel-"));
}

function repoGit(dir, arquivos) {
  mkdirSync(dir, { recursive: true });
  const git = (...args) => execFileSync("git", ["-C", dir, "-c", "user.name=t", "-c", "user.email=t@example.com", ...args], { stdio: "ignore" });
  git("init", "-q", "-b", "main");
  for (const [nome, conteudo] of Object.entries(arquivos)) {
    mkdirSync(join(dir, nome, ".."), { recursive: true });
    writeFileSync(join(dir, nome), conteudo);
  }
  git("add", "-A");
  git("commit", "-q", "-m", "feat: primeiro commit");
  return dir;
}

test("scripts do painel são idênticos depois de renderizados (sem {{ }} de template)", () => {
  const vars = resolveVars(defaultVars({ nome: "app", prefixo: "M", dono: "Ana" }));
  const arquivos = listTemplates(NUCLEO).filter((f) => f.startsWith("scripts/painel/"));
  assert.ok(arquivos.length >= 8);
  for (const arquivo of arquivos) {
    const texto = readFileSync(join(NUCLEO, arquivo), "utf8");
    assert.equal(render(texto, vars), texto, arquivo);
  }
});

test("scripts do painel só vão para o projeto com PAINEL ligado", () => {
  const todos = listTemplates(NUCLEO);
  assert.ok(outputsFor(todos, { NO_UI_COMMENTS: false, PAINEL: true }).includes("scripts/painel/painel.mjs"));
  assert.ok(!outputsFor(todos, { NO_UI_COMMENTS: false, PAINEL: false }).some((f) => f.startsWith("scripts/painel/")));
});

test("situações clássicas do painel são as mesmas do núcleo", () => {
  assert.deepEqual(configPainel.SITUACOES_CLASSICAS, SITUACOES_CLASSICAS);
});

test("painel não tem comentário de código nem travessão", () => {
  for (const arquivo of listTemplates(NUCLEO).filter((f) => f.startsWith("scripts/painel/"))) {
    const texto = readFileSync(join(NUCLEO, arquivo), "utf8");
    assert.ok(!/^\s*\/\//m.test(texto), `${arquivo} tem comentário //`);
    assert.ok(!/\/\*/.test(texto), `${arquivo} tem comentário /* */`);
    assert.ok(!/[—–]/.test(texto), `${arquivo} tem travessão`);
  }
});

test("mapa lê stack, Node, porta, commits e branch de repositórios reais", () => {
  const base = temporario();
  const api = repoGit(join(base, "api"), {
    "package.json": JSON.stringify({ name: "api", dependencies: { "@nestjs/core": "^9.1.0" }, devDependencies: { typescript: "~5.0.2" } }),
    ".nvmrc": "18.17.0\n",
    "src/main.ts": "app.listen(process.env.PORT || 3123);",
  });
  const web = repoGit(join(base, "web"), {
    "package.json": JSON.stringify({ name: "web", dependencies: { next: "14.2.1" }, engines: { node: ">=20" } }),
    ".env.example": "PORT=3200\nAPI_URL=http://localhost:3123\n",
  });
  const mapa = coletarMapa([
    { nome: "api", caminho: "api", absoluto: api },
    { nome: "web", caminho: "web", absoluto: web },
  ]);
  const [a, w] = mapa.repos;
  assert.deepEqual(a.stack.map((s) => `${s.nome} ${s.versao}`), ["NestJS 9.1.0", "TypeScript 5.0.2"]);
  assert.equal(a.node.versao, "18.17.0");
  assert.equal(a.porta.porta, 3123);
  assert.equal(a.commits, 1);
  assert.equal(a.ultimoCommit.assunto, "feat: primeiro commit");
  assert.equal(a.branchPadrao, "main");
  assert.equal(a.arquivos, 3);
  assert.equal(w.node.versao, ">=20");
  assert.equal(w.porta.porta, 3200);
  assert.deepEqual(mapa.conexoesSugeridas.map((c) => `${c.de}>${c.para}`), ["web>api"]);
});

test("segredo de .env.example com cara de token nunca aparece no mapa.json", () => {
  const base = temporario();
  const repo = repoGit(join(base, "svc"), {
    "package.json": JSON.stringify({ name: "svc" }),
    ".env.example": [
      "PORT=4100",
      "GITHUB_TOKEN=ghp_AbCdEf1234567890SEGREDOTOKEN",
      "JWT_SECRET=eyJhbGciOiJIUzI1NiJ9.SEGREDOJWT",
      "API_KEY=sk_live_SEGREDOCHAVE",
      "DB_PASSWORD=SenhaSuperSecreta123",
      "DATABASE_URL=postgres://admin:SEGREDOSENHA@banco.interno:5432/app",
      "WEBHOOK=https://hooks.exemplo.test/services/T000/B000/SEGREDOWEBHOOK",
    ].join("\n"),
    "src/environments/environment.ts": "export const environment = { apiKey: 'AIzaSEGREDOAMBIENTE', apiUrl: 'https://u:SEGREDOURL@api.exemplo.test:8443/v1' };",
  });
  const mapa = coletarMapa([{ nome: "svc", caminho: "svc", absoluto: repo }]);
  const json = JSON.stringify(mapa);
  for (const segredo of ["ghp_", "SEGREDO", "eyJ", "sk_live", "SenhaSuper", "admin", "T000"]) {
    assert.ok(!json.includes(segredo), `vazou: ${segredo}`);
  }
  const enderecos = mapa.repos[0].enderecos.map((e) => `${e.host}:${e.porta}`);
  assert.ok(enderecos.includes("banco.interno:5432"));
  assert.ok(enderecos.includes("api.exemplo.test:8443"));
  assert.equal(mapa.repos[0].porta.porta, 4100);
});

test("mapa nunca lê o .env de verdade", () => {
  const base = temporario();
  const repo = repoGit(join(base, "svc"), { "package.json": "{}" });
  writeFileSync(join(repo, ".env"), "PORT=9999\nDB=postgres://u:SEGREDOREAL@host.real:5432/x\n");
  writeFileSync(join(repo, ".env.local"), "PORT=9998\n");
  const mapa = coletarRepo({ nome: "svc", caminho: "svc", absoluto: repo });
  assert.equal(mapa.porta, null);
  assert.deepEqual(mapa.enderecos, []);
  assert.ok(!JSON.stringify(mapa).includes("SEGREDOREAL"));
});

test("leitores de porta e endereço", () => {
  assert.equal(lerMainTs("await app.listen(8080);"), 8080);
  assert.equal(lerMainTs("nada aqui"), null);
  assert.deepEqual(lerAmbienteTs("port: 4200, url: 'http://api:3000/x'").portas, [4200]);
  assert.deepEqual(lerEnvExemplo("export PORT=\"3000\"\nSERVER_PORT=70000\nX=abc").portas, [{ chave: "PORT", porta: 3000 }]);
});

test("sugestão de conexão por porta local ou por nome do host", () => {
  const repos = [
    { nome: "a", porta: { porta: 1 }, enderecos: [{ host: "localhost", porta: 2, protocolo: "http", origem: "x" }, { host: "c", porta: null, protocolo: "http", origem: "x" }] },
    { nome: "b", porta: { porta: 2 }, enderecos: [] },
    { nome: "c", porta: null, enderecos: [] },
  ];
  assert.deepEqual(sugerirConexoes(repos).map((s) => `${s.de}>${s.para}`), ["a>b", "a>c"]);
});

test("diagrama SVG tem nó por sistema, aresta com rótulo e escapa texto", () => {
  const grafo = montarGrafo({
    conexoes: [{ de: "web", para: "api", protocolo: "REST", autenticacao: "JWT" }, { de: "api", para: "<db>", protocolo: "SQL" }],
    sugeridas: [{ de: "web", para: "api", protocolo: "http" }, { de: "api", para: "cache", protocolo: "redis" }],
  });
  assert.equal(grafo.arestas.length, 3);
  const svg = gerarSvg(grafo);
  assert.ok(svg.startsWith("<svg"));
  assert.equal((svg.match(/<rect class="cx-no/g) ?? []).length, 4);
  assert.ok(svg.includes("REST · JWT"));
  assert.ok(svg.includes("&lt;db&gt;") && !svg.includes("<db>"));
  assert.ok(svg.includes('class="cx-aresta sugerida"'));
  const { posicoes } = posicionar(grafo);
  assert.ok(posicoes.get("web").x < posicoes.get("api").x);
  assert.equal(gerarSvg({ nos: [], arestas: [] }), "");
});

test("diagrama aguenta ciclo sem travar", () => {
  const grafo = montarGrafo({ conexoes: [{ de: "a", para: "b" }, { de: "b", para: "a" }, { de: "a", para: "a" }] });
  assert.ok(gerarSvg(grafo).includes("</svg>"));
});

test("quadro lê itens antigos e estendidos, com checklist e situações", () => {
  assert.deepEqual(criteriosDoTexto("- [x] a\n- [~] b\n- [ ] c\n- d"), [
    { texto: "a", estado: "feito" },
    { texto: "b", estado: "parcial" },
    { texto: "c", estado: "pendente" },
    { texto: "d", estado: "pendente" },
  ]);
  const secoes = parseDescricao("**Problema**\nUm.\n\n**Pronto quando**\n- [x] ok\n\n## Decisões\nFeito assim.");
  assert.equal(secoes.problema, "Um.");
  assert.equal(secoes.decisoes, "Feito assim.");

  const base = temporario();
  mkdirSync(join(base, "docs"));
  writeFileSync(join(base, "docs", "backlog.json"), JSON.stringify({
    prefix: "Z",
    items: [
      { ref: 1, title: "antigo", status: "doing", priority: "alta", description: "**Pronto quando**\n- [x] a\n- [ ] b" },
      { ref: 2, title: "novo", status: "done", priority: "baixa", criterios: [{ texto: "x", estado: "parcial" }], prs: ["PR texto"], veredito: { resultado: "APROVADO" }, achadosExtras: [{ titulo: "outro" }] },
      { ref: 3, title: "estranho", status: "inexistente", priority: "media" },
    ],
  }));
  const config = { prefixo: "P", situacoes: SITUACOES_CLASSICAS };
  const quadro = lerQuadro(base, config);
  assert.equal(quadro.prefixo, "Z");
  assert.deepEqual(quadro.itens[0].resumo, { feito: 1, parcial: 0, pendente: 1, total: 2 });
  assert.equal(quadro.itens[0].codigo, "Z-1");
  assert.equal(quadro.itens[1].criterios[0].estado, "parcial");
  assert.equal(quadro.itens[1].veredito.resultado, "APROVADO");
  assert.deepEqual(quadro.situacoes.find((s) => s.id === "doing").itens.map((i) => i.ref), [1]);
  assert.deepEqual(quadro.situacoes.find((s) => s.id === "outras").itens.map((i) => i.ref), [3]);
});

test("handoff: próximo passo e pendências do dono", () => {
  const base = temporario();
  mkdirSync(join(base, "docs"));
  writeFileSync(join(base, "docs", "HANDOFF.md"), "# H\n\n## Próximo passo exato\nFazer X.\n\n## Pendências de Ana\n- rodar SQL\n- <vazio>\n\n## Em andamento\n- Z-1: algo\n");
  const h = lerHandoff(base);
  assert.equal(h.proximoPasso, "Fazer X.");
  assert.deepEqual(h.pendencias, ["rodar SQL"]);
  assert.deepEqual(h.emAndamento, ["Z-1: algo"]);
});

test("painel serve dashboard, sistemas, conexões, quadro e item do exemplo", () => {
  const base = temporario();
  const { projeto } = criarExemplo(base);
  const config = JSON.parse(readFileSync(join(projeto, "docs", "processo", "config.json"), "utf8"));
  assert.equal(config.vars.REPOS.length, 3);
  const { repos } = criarExemplo(join(base, "x"));
  assert.ok(repos);
  const mapa = coletarMapa(config.vars.REPOS.map((r) => ({ nome: r.nome, caminho: r.caminho, absoluto: join(projeto, r.caminho) })));
  mkdirSync(join(projeto, "docs", "painel"), { recursive: true });
  writeFileSync(join(projeto, "docs", "painel", "mapa.json"), JSON.stringify(mapa));

  const dash = rotear(projeto, "/").html;
  assert.ok(dash.includes("loja-demo") && dash.includes("Em desenvolvimento") && dash.includes("Aprovar a proposta do L-3"));
  assert.ok(dash.includes("centavos inteiros"));
  assert.ok(rotear(projeto, "/sistemas").html.includes("API da loja"));
  const sistema = rotear(projeto, "/sistemas/loja-api").html;
  assert.ok(sistema.includes("NestJS") && sistema.includes("18.19.0") && sistema.includes("3000"));
  const cx = rotear(projeto, "/sistemas/conexoes").html;
  assert.ok(cx.includes("<svg") && cx.includes("chave de API"));
  assert.ok(rotear(projeto, "/quadro").html.includes("L-2"));
  const item = rotear(projeto, "/quadro/2").html;
  for (const trecho of ["Pronto quando", "parcial", "Decisões", "PRs", "Veredito do testador", "Linha do tempo", "Achados extras", "Texto sugerido", "data-copiar"]) {
    assert.ok(item.includes(trecho), trecho);
  }
  assert.ok(rotear(projeto, "/quadro/4").html.includes("RECUSADO"));
  const ausente = rotear(projeto, "/quadro/999");
  assert.equal(ausente.status, 404);
  assert.ok(ausente.html.includes("Página não encontrada"));
  assert.equal(rotear(projeto, "/quadro/2").status, 200);
  assert.equal(rotear(projeto, "/sistemas/nao-existe").status, 404);
  assert.equal(rotear(projeto, "/quadro/%E0").status, 404);
  assert.equal(rotear(projeto, "/sistemas/%E0%A4%A").status, 404);
  const html = rotear(projeto, "/sistemas/conexoes").html;
  assert.ok(!/ghp_|sk_live|tok_EXEMPLO|senha-ficticia/.test(html + JSON.stringify(mapa)));
});

test("servidor: padrão 127.0.0.1, 404 para URL malformada e para arquivo fora de docs", async () => {
  const base = temporario();
  const { projeto } = criarExemplo(base);
  const { criarServidor } = await import("../nucleo/scripts/painel/painel.mjs");
  const servidor = criarServidor(projeto);
  await new Promise((ok) => servidor.listen(0, "127.0.0.1", ok));
  const porta = servidor.address().port;
  try {
    for (const [caminho, status] of [["/", 200], ["/quadro/%E0", 404], ["/arquivos/%E0", 404], ["/arquivos/../processo/config.json", 404], ["/arquivos/painel/x.png", 404]]) {
      const resposta = await fetch(`http://127.0.0.1:${porta}${caminho}`);
      assert.equal(resposta.status, status, caminho);
    }
  } finally {
    servidor.close();
  }
  assert.equal(configPainel.lerConfig(projeto).host, "127.0.0.1");
});
