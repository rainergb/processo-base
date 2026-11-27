// GERADO por processo-base (nucleo/scripts/front-comments.mjs). Não edite aqui: mude lá e
// rode `npm run sync`. As pastas vêm do projetos.json (UI_COMMENT_DIRS_JSON e UI_COMMENT_SKIP_JSON).
//
// Código de tela sem comentários (docs/processo/AGENTS-NUCLEO.md).
//
//   npm run lint:comments             lista e falha se houver comentário
//   npm run lint:comments -- --write  remove
//
// Mantém diretivas de ferramenta (eslint-disable, @ts-expect-error etc.). Antes de
// gravar, prova que só saiu comentário: o JS emitido (sem comentários) antes e
// depois tem de ser igual; arquivo em que mudaria não é tocado.
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const write = process.argv.includes("--write");
const dirs = {{UI_COMMENT_DIRS_JSON}};
const skip = {{UI_COMMENT_SKIP_JSON}};

const KEEP =
  /eslint-(disable|enable)|@ts-(expect-error|ignore|nocheck|check)|prettier-ignore|webpackChunkName|istanbul ignore|^\/\/\/\s*<reference/;

function files(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (skip.includes(path.relative(root, full).replace(/\\/g, "/"))) continue;
      out.push(...files(full));
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name))
      out.push(full);
  }
  return out;
}

function collect(text, fileName) {
  const kind = fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, kind);
  const ranges = new Map();
  const add = (pos, end) => {
    if (!ranges.has(pos) || ranges.get(pos) < end) ranges.set(pos, end);
  };
  const visit = (node) => {
    if (ts.isJsxExpression(node) && !node.expression) {
      const raw = text.slice(node.getStart(sf), node.end);
      if (!KEEP.test(raw)) add(node.getStart(sf), node.end);
      return;
    }
    // Texto visível do JSX não é trivia: "// algo" ali é conteúdo da tela.
    if (node.kind === ts.SyntaxKind.JsxText) return;
    for (const r of ts.getLeadingCommentRanges(text, node.pos) ?? []) add(r.pos, r.end);
    for (const r of ts.getTrailingCommentRanges(text, node.end) ?? []) add(r.pos, r.end);
    // getChildren (e não forEachChild) visita também os tokens, como o `}` de
    // um bloco: comentário logo antes dele não pertence a nenhum outro nó.
    for (const child of node.getChildren(sf)) visit(child);
  };
  visit(sf);
  visit(sf.endOfFileToken);
  // Só comentários de verdade (o parser às vezes devolve o mesmo trecho por dois nós) e fora das diretivas.
  let list = [...ranges.entries()]
    .map(([pos, end]) => ({ pos, end }))
    .filter(({ pos, end }) => !KEEP.test(text.slice(pos, end)))
    .sort((a, b) => a.pos - b.pos);
  // Descarta intervalos contidos em outro (comentário dentro de `{/* */}`).
  const merged = [];
  for (const r of list) {
    const last = merged[merged.length - 1];
    if (last && r.pos < last.end) {
      last.end = Math.max(last.end, r.end);
      continue;
    }
    merged.push({ ...r });
  }
  return merged;
}

function strip(text, ranges) {
  let out = text;
  for (const { pos, end } of [...ranges].reverse()) {
    const lineStart = out.lastIndexOf("\n", pos - 1) + 1;
    let lineEnd = out.indexOf("\n", end);
    if (lineEnd === -1) lineEnd = out.length;
    const before = out.slice(lineStart, pos);
    const after = out.slice(end, lineEnd).replace(/\r$/, "");
    if (before.trim() === "" && after.trim() === "") {
      out = out.slice(0, lineStart) + out.slice(Math.min(lineEnd + 1, out.length));
    } else if (after.trim() === "") {
      const trimmedStart = pos - (before.length - before.trimEnd().length);
      out = out.slice(0, trimmedStart) + out.slice(end);
    } else {
      out = out.slice(0, pos) + out.slice(end);
    }
  }
  return out;
}

function emit(text, fileName) {
  const js = ts.transpileModule(text, {
    fileName,
    compilerOptions: {
      removeComments: true,
      jsx: ts.JsxEmit.Preserve,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
    },
  }).outputText;
  // `{}` vazio (comentário JSX removido) e espaço em branco não mudam o comportamento.
  return js
    .replace(/\{\s*\}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

let changed = 0;
let removed = 0;
const failures = [];
for (const dir of dirs) {
  for (const file of files(path.join(root, dir))) {
    const text = fs.readFileSync(file, "utf8");
    const ranges = collect(text, file);
    if (ranges.length === 0) continue;
    const next = strip(text, ranges);
    if (emit(text, file) !== emit(next, file)) {
      failures.push(path.relative(root, file));
      continue;
    }
    changed++;
    removed += ranges.length;
    if (write) fs.writeFileSync(file, next);
  }
}
if (!write && changed > 0) {
  console.log(
    `${changed} arquivo(s) de tela com ${removed} comentário(s). Rode: npm run lint:comments -- --write`,
  );
  process.exitCode = 1;
} else {
  console.log(
    write
      ? `${changed} arquivo(s), ${removed} comentário(s) removido(s).`
      : "Código de tela sem comentários.",
  );
}
if (failures.length) {
  process.exitCode = 1;
  console.log("NÃO mexidos (saída mudaria):\n  " + failures.join("\n  "));
}
