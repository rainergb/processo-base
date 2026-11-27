// Lê o quadro {{PREFIX}}-N (docs/backlog.json).
//   npm run backlog              itens abertos (tudo que não está fechado)
//   npm run backlog -- --all     todos
//   npm run backlog -- {{PREFIX}}-12    um item completo
import { existsSync, readFileSync } from "node:fs";
import { emptyBoard, findItem, formatLine, listItems } from "./backlog-core.mjs";

const FILE = "docs/backlog.json";
const board = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : emptyBoard("{{PREFIX}}");
const args = process.argv.slice(2);
const target = args.find((arg) => !arg.startsWith("--"));

if (target) {
  const item = findItem(board, target);
  if (!item) {
    console.error(`não achei ${target}`);
    process.exit(1);
  }
  console.log(formatLine(board, item));
  console.log(`\n${item.description || "(sem descrição)"}`);
} else {
  const items = listItems(board, { all: args.includes("--all") });
  console.log(items.length ? items.map((item) => formatLine(board, item)).join("\n") : "Quadro vazio.");
}
