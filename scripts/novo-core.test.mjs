import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { defaultVars, parseRepos, resolveVars, withBoardScripts } from "./novo-core.mjs";
import { listTemplates, outputsFor } from "./outputs.mjs";
import { render } from "./render.mjs";

const vars = resolveVars(defaultVars({ nome: "meu-app", prefixo: "M", dono: "Ana" }));

test("projeto novo renderiza todo o nucleo sem variavel faltando", () => {
  const nucleo = join(import.meta.dirname, "..", "nucleo");
  for (const file of outputsFor(listTemplates(nucleo), vars)) {
    const out = render(readFileSync(join(nucleo, file), "utf8"), vars);
    assert.ok(!out.includes("{{"), `${file} ficou com {{`);
  }
});

test("templates renderizados nao contem termos pessoais", () => {
  const nucleo = join(import.meta.dirname, "..", "nucleo");
  const terms = ["rainer", "luciana", "noiva", "5h", "17/11", "asol", "maratonando", "tv-time"];
  for (const file of outputsFor(listTemplates(nucleo), vars)) {
    const out = render(readFileSync(join(nucleo, file), "utf8"), vars).toLowerCase();
    for (const term of terms) {
      assert.ok(!out.includes(term), `${file} contem termo pessoal: "${term}"`);
    }
  }
});

test("modelos do projeto renderizam com NOME e HOJE", () => {
  const all = { ...vars, NOME: "meu-app", HOJE: "2026-11-27" };
  const modelos = join(import.meta.dirname, "..", "modelos", "projeto");
  for (const file of listTemplates(modelos)) {
    const out = render(readFileSync(join(modelos, file), "utf8"), all);
    assert.ok(!out.includes("{{"), `${file} ficou com {{`);
  }
});

test("modelos do projeto nao contem termos pessoais", () => {
  const all = { ...vars, NOME: "meu-app", HOJE: "2026-11-27" };
  const modelos = join(import.meta.dirname, "..", "modelos", "projeto");
  const terms = ["rainer", "luciana", "noiva", "5h", "17/11", "c:/dev", "asol", "maratonando", "tv-time"];
  for (const file of listTemplates(modelos)) {
    const out = render(readFileSync(join(modelos, file), "utf8"), all).toLowerCase();
    for (const term of terms) {
      assert.ok(!out.includes(term), `modelos/${file} contem termo pessoal: "${term}"`);
    }
  }
});

test("nome e prefixo invalidos falham", () => {
  assert.throws(() => defaultVars({ nome: "Meu App", prefixo: "M", dono: "Ana" }), /nome/);
  assert.throws(() => defaultVars({ nome: "app", prefixo: "m1", dono: "Ana" }), /prefixo/);
});

test("novo sem --dono falha", () => {
  assert.throws(() => defaultVars({ nome: "app", prefixo: "M" }), /dono/);
  assert.throws(() => defaultVars({ nome: "app", prefixo: "M", dono: "" }), /dono/);
});

test("scripts do quadro nao sobrescrevem os do projeto", () => {
  const pkg = withBoardScripts({ name: "x", scripts: { backlog: "meu" } });
  assert.equal(pkg.scripts.backlog, "meu");
  assert.equal(pkg.scripts["backlog:add"], "node scripts/backlog-add.mjs");
});

test("OWNER esta nas variaveis do projeto novo", () => {
  assert.equal(vars.OWNER, "Ana");
  assert.equal(vars.PROJECT_NAME, "meu-app");
  assert.equal(typeof vars.NO_EM_DASH, "boolean");
  assert.equal(typeof vars.WRITING_LANGS, "string");
  assert.ok(vars.WRITING_LANGS.length > 0, "WRITING_LANGS nao pode ser vazio");
});

function nucleo(extra = {}) {
  const dir = join(import.meta.dirname, "..", "nucleo", "docs", "processo", "AGENTS-NUCLEO.md");
  const all = resolveVars({ ...defaultVars({ nome: "app", prefixo: "M", dono: "Ana" }), ...extra });
  return render(readFileSync(dir, "utf8"), all);
}

test("MERGE_POLICY dono: merge e push só com OK do dono e sem texto de merge livre", () => {
  const out = nucleo({ MERGE_POLICY: "dono" });
  assert.match(out, /Merge e push só com OK de Ana/);
  assert.ok(!/merge na main sem perguntar/i.test(out));
  assert.ok(!/mergeia na main e sobe/i.test(out));
  assert.ok(!/Push em lote/.test(out));
});

test("padrão preserva o comportamento atual", () => {
  const out = nucleo();
  assert.match(out, /Merge na main sem perguntar/);
  assert.match(out, /Push em lote/);
  assert.ok(out.includes("M-12 feat(widgets)"));
  assert.match(out, /só prioridade alta/);
  assert.ok(!out.includes("Vários repositórios"));
});

test("config antigo, sem as chaves novas, ainda renderiza com os padrões antigos", () => {
  const antigo = defaultVars({ nome: "app", prefixo: "M", dono: "Ana" });
  for (const key of ["SITUACOES", "MERGE_POLICY", "PUSH_POLICY", "COMMIT_STYLE", "TESTER_SCOPE", "REPOS", "PAINEL", "POS_DEPLOY"]) delete antigo[key];
  const all = resolveVars(antigo);
  assert.equal(all.ST_ANDAMENTO, "doing");
  assert.equal(all.ST_FILA, "todo");
  assert.equal(all.PAINEL, false);
  assert.ok(!render(readFileSync(join(import.meta.dirname, "..", "nucleo", "docs", "processo", "AGENTS-NUCLEO.md"), "utf8"), all).includes("{{"));
});

test("PUSH_POLICY dono, COMMIT_STYLE conventional e TESTER_SCOPE todas", () => {
  const out = nucleo({ PUSH_POLICY: "dono", COMMIT_STYLE: "conventional", TESTER_SCOPE: "todas" });
  assert.match(out, /Push só com OK de Ana/);
  assert.match(out, /Merge na main sem perguntar/);
  assert.ok(out.includes("fix: corrige filtro de data (M-12)"));
  assert.match(out, /Toda prioridade passa pelo testador/);
});

test("REPOS gera a seção de vários repositórios", () => {
  const out = nucleo({ REPOS: parseRepos("api=../api, web=../web") });
  assert.match(out, /# Vários repositórios/);
  assert.ok(out.includes("`api` (`../api`)"));
});

test("valor inválido de flag falha", () => {
  assert.throws(() => resolveVars({ ...defaultVars({ nome: "app", prefixo: "M", dono: "Ana" }), MERGE_POLICY: "talvez" }), /MERGE_POLICY/);
  assert.throws(() => parseRepos("semcaminho"), /repos/);
});

test("proposta, correção mínima, segurança e situações estão no núcleo", () => {
  const out = nucleo();
  for (const trecho of ["# Proposta antes do código", "# Correção mínima", "# Segurança", "Achados extras", "Nunca ler `.env`", "Verificação pós-deploy", "Sessão filha"]) {
    assert.ok(out.includes(trecho), trecho);
  }
  for (const nome of ["Proposta", "Em desenvolvimento", "Em revisão", "Em teste", "Testado", "Commitado", "Mergeado", "Finalizado"]) {
    assert.ok(out.includes(nome), nome);
  }
});
