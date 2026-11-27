// Cria um projeto novo no processo.
//   node scripts/novo.mjs --nome meu-app --caminho /caminho/para/meu-app --prefixo M --dono Ana
//   npm run novo -- --nome meu-app --caminho /caminho/para/meu-app --prefixo M --dono Ana
//
// Opcoes:
//   --nome       nome do projeto (minusculas, numeros e hifen) [obrigatorio]
//   --caminho    caminho do projeto [padrao: diretorio atual]
//   --prefixo    prefixo do quadro, ex: M (1 a 3 letras maiusculas) [obrigatorio]
//   --dono       nome de quem decide e aprova no projeto (OWNER) [obrigatorio]
//   --merge      lider (padrao) ou dono: merge e push so com OK do dono
//   --push       lote (padrao) ou dono
//   --commit     prefixo (padrao) ou conventional
//   --testador   alta (padrao) ou todas: quais prioridades passam pelo testador
//   --repos      "nome=caminho,nome2=caminho2" para projeto com varios repositorios
//   --sem-painel nao gera os scripts do painel
//   --registrar  se fornecido, adiciona o caminho ao projetos.json do processo-base
//
// 1. Escreve docs/processo/config.json no projeto com as variaveis padrao.
// 2. Copia modelos/projeto (AGENTS.md, docs/, quadro local em scripts/) so onde o arquivo nao existe.
// 3. Adiciona `backlog` e `backlog:add` ao package.json, se houver um.
// 4. Roda o sync so para ele (CLAUDE.md, docs/processo, skills).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defaultVars, parseRepos, resolveVars, withBoardScripts } from "./novo-core.mjs";
import { listTemplates } from "./outputs.mjs";
import { render } from "./render.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const options = {};
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i].startsWith("--")) {
    // flags booleanas sem valor seguinte
    const nextArg = argv[i + 1];
    if (nextArg === undefined || nextArg.startsWith("--")) {
      options[argv[i].slice(2)] = true;
    } else {
      options[argv[i].slice(2)] = nextArg;
      i += 1;
    }
  }
}

const { nome, prefixo, dono } = options;
const caminho = options.caminho || process.cwd();
const registrar = Boolean(options.registrar);

if (!nome || !prefixo || !dono) {
  console.error(
    "Uso: node scripts/novo.mjs --nome meu-app --prefixo M --dono Ana [--caminho /caminho] [--registrar]",
  );
  process.exit(1);
}

const vars = defaultVars({ nome, prefixo, dono });
const escolhas = { MERGE_POLICY: options.merge, PUSH_POLICY: options.push, COMMIT_STYLE: options.commit, TESTER_SCOPE: options.testador };
for (const [chave, valor] of Object.entries(escolhas)) if (typeof valor === "string") vars[chave] = valor;
if (typeof options.repos === "string") vars.REPOS = parseRepos(options.repos);
if (options["sem-painel"]) vars.PAINEL = false;
const resolved = resolveVars(vars);
const projectPath = String(caminho).replace(/\\/g, "/");
mkdirSync(projectPath, { recursive: true });

// Escreve docs/processo/config.json no projeto
const configDir = join(projectPath, "docs", "processo");
const configFile = join(configDir, "config.json");
if (existsSync(configFile)) {
  console.error(
    `[novo] ${configFile} ja existe. Use /processo:sincronizar para atualizar o projeto.`,
  );
  process.exit(1);
}
mkdirSync(configDir, { recursive: true });
const config = { name: nome, vars };
writeFileSync(configFile, `${JSON.stringify(config, null, 2)}\n`, "utf8");
console.log(`[novo] criado: docs/processo/config.json`);

// Copia modelos/projeto so onde o arquivo nao existe
const modelos = join(ROOT, "modelos", "projeto");
const extra = { NOME: nome, HOJE: new Date().toISOString().slice(0, 10) };
for (const file of listTemplates(modelos)) {
  const target = join(projectPath, file);
  if (existsSync(target)) {
    console.log(`[novo] mantido: ${file}`);
    continue;
  }
  const template = readFileSync(join(modelos, file), "utf8").replace(/\r\n/g, "\n");
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, render(template, { ...resolved, ...extra }), "utf8");
  console.log(`[novo] criado: ${file}`);
}

// Adiciona scripts de backlog ao package.json se existir
const pkgFile = join(projectPath, "package.json");
if (existsSync(pkgFile)) {
  const pkg = JSON.parse(readFileSync(pkgFile, "utf8"));
  writeFileSync(pkgFile, `${JSON.stringify(withBoardScripts(pkg, { painel: Boolean(vars.PAINEL) }), null, 2)}\n`, "utf8");
  console.log("[novo] package.json: scripts do quadro e do painel");
} else {
  console.log("[novo] sem package.json: rode o quadro com `node scripts/backlog.mjs`");
}

// Registra no projetos.json se --registrar foi passado
if (registrar) {
  const projectsFile = join(ROOT, "projetos.json");
  if (existsSync(projectsFile)) {
    const projects = JSON.parse(readFileSync(projectsFile, "utf8"));
    if (!projects[nome]) {
      projects[nome] = projectPath;
      writeFileSync(projectsFile, `${JSON.stringify(projects, null, 2)}\n`, "utf8");
      console.log(`[novo] ${nome} adicionado ao projetos.json`);
    } else {
      console.log(`[novo] ${nome} ja esta no projetos.json`);
    }
  } else {
    const newProjects = { [nome]: projectPath };
    writeFileSync(projectsFile, `${JSON.stringify(newProjects, null, 2)}\n`, "utf8");
    console.log(`[novo] projetos.json criado com ${nome}`);
  }
}

execFileSync(process.execPath, [join(ROOT, "scripts", "sync.mjs"), "--project", projectPath], {
  stdio: "inherit",
});
console.log(
  `[novo] pronto. Revise ${configFile} e ligue o que o projeto tiver (E2E, DESIGN_APPROVAL, etc.).`,
);
