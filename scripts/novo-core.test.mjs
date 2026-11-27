import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { defaultVars, withBoardScripts } from "./novo-core.mjs";
import { listTemplates, outputsFor } from "./outputs.mjs";
import { render } from "./render.mjs";

const vars = defaultVars({ nome: "meu-app", prefixo: "M", dono: "Ana" });

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
