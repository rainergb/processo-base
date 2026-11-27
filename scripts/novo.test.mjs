import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const RAIZ = join(import.meta.dirname, "..");

function rodar(script, ...args) {
  return execFileSync(process.execPath, [join(RAIZ, "scripts", script), ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function projetoNovo(...extra) {
  const dir = mkdtempSync(join(tmpdir(), "novo-"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "x", scripts: {} }));
  rodar("novo.mjs", "--nome", "demo", "--caminho", dir, "--prefixo", "D", "--dono", "Ana", ...extra);
  return dir;
}

test("novo cria os 3 agentes e o testador só tem ferramentas do navegador embutido", () => {
  const dir = projetoNovo();
  for (const nome of ["analista-proposta", "especialista", "testador"]) {
    assert.ok(existsSync(join(dir, ".claude", "agents", `${nome}.md`)), nome);
  }
  const testador = readFileSync(join(dir, ".claude", "agents", "testador.md"), "utf8");
  const tools = testador.match(/^tools:\s*(.+)$/m)[1].split(",").map((t) => t.trim());
  assert.ok(tools.length > 5);
  for (const tool of tools) assert.ok(tool.startsWith("mcp__Claude_Browser__"), tool);
  for (const proibida of ["Read", "Bash", "Edit", "Write", "Grep", "Glob"]) assert.ok(!tools.includes(proibida), proibida);
  assert.match(testador, /^model: sonnet$/m);

  const analista = readFileSync(join(dir, ".claude", "agents", "analista-proposta.md"), "utf8");
  assert.match(analista, /^model: opus$/m);
  assert.match(analista, /^tools: Read, Grep, Glob, Bash$/m);
  assert.match(readFileSync(join(dir, ".claude", "agents", "especialista.md"), "utf8"), /^model: sonnet$/m);
  assert.ok(existsSync(join(dir, "docs", "processo", "BRIEF-MODELO.md")));
  assert.ok(existsSync(join(dir, "docs", "processo", "RELATORIO-TESTE-MODELO.md")));
});

test("novo traz o painel, os scripts do package.json e os JSON manuais", () => {
  const dir = projetoNovo();
  assert.ok(existsSync(join(dir, "scripts", "painel", "painel.mjs")));
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  assert.equal(pkg.scripts.mapa, "node scripts/painel/mapa.mjs");
  assert.equal(pkg.scripts.painel, "node scripts/painel/painel.mjs");
  assert.ok(existsSync(join(dir, "docs", "SISTEMAS.json")));
  assert.ok(existsSync(join(dir, "docs", "CONEXOES.json")));
  const semPainel = projetoNovo("--sem-painel");
  assert.ok(!existsSync(join(semPainel, "scripts", "painel")));
});

test("novo com --merge dono gera o núcleo sem merge livre e o sync confere em dia", () => {
  const dir = projetoNovo("--merge", "dono", "--repos", "api=../api,web=../web");
  const nucleo = readFileSync(join(dir, "docs", "processo", "AGENTS-NUCLEO.md"), "utf8");
  assert.match(nucleo, /Merge e push só com OK de Ana/);
  assert.ok(!/merge sem perguntar/i.test(nucleo));
  assert.ok(!/merge na main sem perguntar/i.test(nucleo));
  const config = JSON.parse(readFileSync(join(dir, "docs", "processo", "config.json"), "utf8"));
  assert.equal(config.vars.MERGE_POLICY, "dono");
  assert.deepEqual(config.vars.REPOS, [{ nome: "api", caminho: "../api" }, { nome: "web", caminho: "../web" }]);
  assert.match(rodar("sync.mjs", "--project", dir, "--check"), /tudo em dia/);
});

test("projeto com config da 0.1 continua sincronizando, sem painel", () => {
  const dir = projetoNovo();
  const arquivo = join(dir, "docs", "processo", "config.json");
  const config = JSON.parse(readFileSync(arquivo, "utf8"));
  for (const chave of ["SITUACOES", "POS_DEPLOY", "MERGE_POLICY", "PUSH_POLICY", "COMMIT_STYLE", "TESTER_SCOPE", "REPOS", "PAINEL", "PAINEL_PORT"]) delete config.vars[chave];
  writeFileSync(arquivo, JSON.stringify(config));
  rodar("sync.mjs", "--project", dir);
  const nucleo = readFileSync(join(dir, "docs", "processo", "AGENTS-NUCLEO.md"), "utf8");
  assert.match(nucleo, /Merge na main sem perguntar/);
  assert.match(nucleo, /`doing` Em andamento/);
  assert.match(rodar("sync.mjs", "--project", dir, "--check"), /tudo em dia/);
});
