import assert from "node:assert/strict";
import { test } from "node:test";
import { migrateProjects } from "./migrar-core.mjs";

const antigo = { app: { path: "C:\\x\\app", vars: { PREFIX: "A", NO_EM_DASH: true } } };

test("migra para lista de caminhos e config com as variáveis novas", () => {
  const { projects, configs } = migrateProjects(antigo, { dono: "Ana" });
  assert.deepEqual(projects, { app: "C:/x/app" });
  assert.equal(configs.app.name, "app");
  assert.equal(configs.app.vars.OWNER, "Ana");
  assert.equal(configs.app.vars.PROJECT_NAME, "app");
  assert.equal(typeof configs.app.vars.WRITING_LANGS, "string");
  assert.equal(configs.app.vars.PREFIX, "A");
});

test("variável que o projeto já tinha vence o padrão", () => {
  assert.equal(migrateProjects(antigo, { dono: "Ana" }).configs.app.vars.NO_EM_DASH, true);
  const sem = { app: { path: "/a", vars: {} } };
  assert.equal(migrateProjects(sem, { dono: "Ana" }).configs.app.vars.NO_EM_DASH, false);
  assert.equal(migrateProjects(sem, { dono: "Ana", semTravessao: true }).configs.app.vars.NO_EM_DASH, true);
});

test("sem dono ou já no formato novo falha", () => {
  assert.throws(() => migrateProjects(antigo, {}), /dono/);
  assert.throws(() => migrateProjects({ app: "/a" }, { dono: "Ana" }), /formato novo/);
});
