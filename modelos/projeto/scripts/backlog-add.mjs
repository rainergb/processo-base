// Grava no quadro {{PREFIX}}-N (docs/backlog.json).
//   npm run backlog:add -- --title "..." [--priority alta] [--area x] [--description "..."]
//   npm run backlog:add -- --update {{PREFIX}}-3 --status doing
// Campos: title, summary, description, area, kind, priority (alta, media, baixa) e status
// (idea, todo, doing, testing, done, dropped).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { code, emptyBoard, pickFields, saveItem } from "./backlog-core.mjs";

const FILE = "docs/backlog.json";
const argv = process.argv.slice(2);
const options = {};
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i].startsWith("--")) options[argv[i].slice(2)] = argv[i + 1] ?? "";
}

try {
  const board = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : emptyBoard("{{PREFIX}}");
  const { board: next, item } = saveItem(board, pickFields(options), options.update);
  writeFileSync(FILE, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  console.log(`${code(next, item)} ${options.update ? "atualizado" : "criado"}: ${item.title} (${item.status})`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
