import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const STACK = [
  ["next", "Next.js"],
  ["react", "React"],
  ["@angular/core", "Angular"],
  ["vue", "Vue"],
  ["@nestjs/core", "NestJS"],
  ["express", "Express"],
  ["fastify", "Fastify"],
  ["@loopback/core", "LoopBack"],
  ["typescript", "TypeScript"],
  ["prisma", "Prisma"],
  ["typeorm", "TypeORM"],
  ["mongoose", "Mongoose"],
  ["tailwindcss", "Tailwind CSS"],
  ["vite", "Vite"],
  ["jest", "Jest"],
  ["vitest", "Vitest"],
  ["@playwright/test", "Playwright"],
];

const MARCADORES = [
  ["build.gradle", "Gradle"],
  ["build.gradle.kts", "Gradle"],
  ["pom.xml", "Maven"],
  ["requirements.txt", "Python"],
  ["pyproject.toml", "Python"],
  ["go.mod", "Go"],
  ["Cargo.toml", "Rust"],
];

const IGNORAR = new Set(["node_modules", ".git", "dist", "build", ".next", "coverage", ".angular", "target"]);
const ARQUIVOS_DE_ENV = [".env.example"];
const PROTOCOLO_PADRAO = { "http:": "http", "https:": "https", "ws:": "ws", "wss:": "wss", "postgres:": "postgres", "postgresql:": "postgres", "mysql:": "mysql", "mongodb:": "mongodb", "redis:": "redis", "amqp:": "amqp" };

export function arquivoDeEnvPermitido(nome) {
  return ARQUIVOS_DE_ENV.includes(nome);
}

function lerTexto(arquivo) {
  try {
    return readFileSync(arquivo, "utf8");
  } catch {
    return null;
  }
}

function limparVersao(valor) {
  return String(valor ?? "").replace(/^[^\d]*/, "").trim() || String(valor ?? "");
}

function enderecoDaUrl(texto) {
  try {
    const url = new URL(texto);
    if (!url.hostname) return null;
    return {
      protocolo: PROTOCOLO_PADRAO[url.protocol] ?? url.protocol.replace(":", ""),
      host: url.hostname,
      porta: url.port ? Number(url.port) : null,
    };
  } catch {
    return null;
  }
}

function portaValida(texto) {
  const numero = Number(texto);
  return Number.isInteger(numero) && numero > 0 && numero < 65536 ? numero : null;
}

export function lerEnvExemplo(conteudo) {
  const portas = [];
  const enderecos = [];
  for (const linha of String(conteudo).replace(/\r\n/g, "\n").split("\n")) {
    const parte = linha.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!parte) continue;
    const chave = parte[1];
    const valor = parte[2].replace(/^["']|["']$/g, "");
    if (/(^|_)PORT$/i.test(chave) && /^\d{2,5}$/.test(valor)) {
      const porta = portaValida(valor);
      if (porta) portas.push({ chave, porta });
    } else if (/^[a-z][a-z0-9+.-]*:\/\//i.test(valor)) {
      const endereco = enderecoDaUrl(valor);
      if (endereco) enderecos.push({ chave, ...endereco });
    }
  }
  return { portas, enderecos };
}

export function lerAmbienteTs(conteudo) {
  const portas = [...String(conteudo).matchAll(/\bport\s*[:=]\s*(\d{2,5})\b/gi)].map((m) => portaValida(m[1])).filter(Boolean);
  const enderecos = [...String(conteudo).matchAll(/['"`]((?:https?|wss?|postgres(?:ql)?|mysql|mongodb|redis|amqp):\/\/[^'"`\s]+)['"`]/g)]
    .map((m) => enderecoDaUrl(m[1]))
    .filter(Boolean);
  return { portas, enderecos };
}

export function lerMainTs(conteudo) {
  const achou = String(conteudo).match(/\.listen\(\s*(?:process\.env\.\w+\s*(?:\|\||\?\?)\s*)?(\d{2,5})/);
  return achou ? portaValida(achou[1]) : null;
}

function arquivosDeAmbiente(dir) {
  const candidatos = [dir, join(dir, "src"), join(dir, "src", "environments"), join(dir, "environments")];
  const achados = [];
  for (const pasta of candidatos) {
    if (!existsSync(pasta)) continue;
    for (const nome of readdirSync(pasta)) {
      if (/^environment(\.[\w-]+)?\.ts$/.test(nome)) achados.push(join(pasta, nome));
    }
  }
  return achados;
}

function git(dir, args) {
  try {
    return execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

function caminhar(dir, lista = []) {
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    if (IGNORAR.has(entrada.name)) continue;
    const cheio = join(dir, entrada.name);
    if (entrada.isDirectory()) caminhar(cheio, lista);
    else lista.push(entrada.name);
  }
  return lista;
}

function dadosDeGit(dir) {
  const dentro = git(dir, ["rev-parse", "--is-inside-work-tree"]) === "true";
  const arquivos = dentro ? (git(dir, ["ls-files"]) ?? "").split("\n").filter(Boolean) : caminhar(dir);
  const porExtensao = {};
  for (const arquivo of arquivos) {
    const ext = extname(arquivo).toLowerCase() || "(sem extensão)";
    porExtensao[ext] = (porExtensao[ext] ?? 0) + 1;
  }
  const extensoes = Object.entries(porExtensao)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([extensao, total]) => ({ extensao, total }));
  if (!dentro) return { git: false, arquivos: arquivos.length, extensoes, commits: 0, ultimoCommit: null, branchPadrao: null };
  const commits = Number(git(dir, ["rev-list", "--count", "HEAD"]) ?? 0) || 0;
  const [hash, data, assunto] = (git(dir, ["log", "-1", "--format=%h%x1f%aI%x1f%s"]) ?? "").split("\x1f");
  const remota = git(dir, ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"])?.replace(/^origin\//, "");
  const existente = ["main", "master", "develop"].find((nome) => git(dir, ["rev-parse", "--verify", "--quiet", `refs/heads/${nome}`]) !== null);
  const branchPadrao = remota || existente || git(dir, ["branch", "--show-current"]) || null;
  return {
    git: true,
    arquivos: arquivos.length,
    extensoes,
    commits,
    ultimoCommit: hash ? { hash, data, assunto } : null,
    branchPadrao,
  };
}

function detectarStack(dir) {
  const pacote = lerTexto(join(dir, "package.json"));
  const stack = [];
  let pkg = null;
  if (pacote) {
    try {
      pkg = JSON.parse(pacote);
    } catch {
      pkg = null;
    }
  }
  const deps = { ...(pkg?.devDependencies ?? {}), ...(pkg?.dependencies ?? {}) };
  for (const [pacoteNome, rotulo] of STACK) {
    if (deps[pacoteNome]) stack.push({ nome: rotulo, versao: limparVersao(deps[pacoteNome]) });
  }
  for (const [arquivo, rotulo] of MARCADORES) {
    if (existsSync(join(dir, arquivo)) && !stack.some((s) => s.nome === rotulo)) stack.push({ nome: rotulo, versao: "" });
  }
  return { pkg, stack };
}

function detectarNode(dir, pkg) {
  for (const arquivo of [".nvmrc", ".node-version"]) {
    const texto = lerTexto(join(dir, arquivo));
    if (texto?.trim()) return { versao: texto.trim().split("\n")[0].trim(), origem: arquivo };
  }
  if (pkg?.engines?.node) return { versao: String(pkg.engines.node), origem: "package.json (engines)" };
  return null;
}

function detectarPortas(dir) {
  const principais = [];
  const enderecos = [];
  const main = [join(dir, "src", "main.ts"), join(dir, "main.ts")].map(lerTexto).find((texto) => texto !== null);
  const portaMain = main ? lerMainTs(main) : null;
  if (portaMain) principais.push({ porta: portaMain, origem: "main.ts" });
  const env = lerTexto(join(dir, ".env.example"));
  if (env) {
    const lido = lerEnvExemplo(env);
    for (const item of lido.portas) principais.push({ porta: item.porta, origem: `.env.example (${item.chave})` });
    for (const item of lido.enderecos) enderecos.push({ ...item, origem: ".env.example" });
  }
  for (const arquivo of arquivosDeAmbiente(dir)) {
    const nome = arquivo.split(/[\\/]/).pop();
    const lido = lerAmbienteTs(lerTexto(arquivo) ?? "");
    for (const porta of lido.portas) principais.push({ porta, origem: nome });
    for (const item of lido.enderecos) enderecos.push({ ...item, origem: nome });
  }
  const vistos = new Set();
  const unicos = enderecos.filter((e) => {
    const chave = `${e.protocolo}://${e.host}:${e.porta ?? ""}|${e.origem}`;
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
  return { porta: principais[0] ?? null, portas: principais, enderecos: unicos };
}

export function coletarRepo({ nome, absoluto, caminho }) {
  if (!existsSync(absoluto) || !statSync(absoluto).isDirectory()) {
    return { nome, caminho, existe: false };
  }
  const { pkg, stack } = detectarStack(absoluto);
  const portas = detectarPortas(absoluto);
  return {
    nome,
    caminho,
    existe: true,
    pacote: pkg ? { nome: pkg.name ?? "", versao: pkg.version ?? "", scripts: Object.keys(pkg.scripts ?? {}) } : null,
    stack,
    node: detectarNode(absoluto, pkg),
    porta: portas.porta,
    enderecos: portas.enderecos,
    ...dadosDeGit(absoluto),
  };
}

const LOCAIS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);

export function sugerirConexoes(repos) {
  const sugestoes = [];
  for (const origem of repos) {
    for (const endereco of origem.enderecos ?? []) {
      const destino = repos.find((outro) => {
        if (outro.nome === origem.nome) return false;
        const portaIgual = outro.porta?.porta && endereco.porta === outro.porta.porta && LOCAIS.has(endereco.host);
        return portaIgual || endereco.host === outro.nome;
      });
      if (destino) {
        sugestoes.push({
          de: origem.nome,
          para: destino.nome,
          protocolo: endereco.protocolo,
          origem: `${endereco.origem}: ${endereco.host}${endereco.porta ? `:${endereco.porta}` : ""}`,
          sugerida: true,
        });
      }
    }
  }
  const vistos = new Set();
  return sugestoes.filter((s) => {
    const chave = `${s.de}>${s.para}`;
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
}

export function coletarMapa(repos, agora = new Date()) {
  const coletados = repos.map(coletarRepo);
  return { geradoEm: agora.toISOString(), repos: coletados, conexoesSugeridas: sugerirConexoes(coletados) };
}
