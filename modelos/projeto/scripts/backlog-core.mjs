// Regras do quadro local (docs/backlog.json). Funções puras: os scripts só leem, chamam e gravam.
// Copiado por processo-base (modelos/projeto). Quando o projeto ganhar banco, troque os scripts
// por versões que falam com ele e mantenha a mesma interface de linha de comando.

export const STATUSES = {{SITUACOES_IDS_JSON}};
export const PRIORITIES = ["alta", "media", "baixa"];
export const OPEN = {{SITUACOES_ABERTAS_JSON}};
export const FIELDS = ["title", "summary", "description", "area", "kind", "priority", "status"];

export function emptyBoard(prefix) {
  return { prefix, items: [] };
}

export function code(board, item) {
  return `${board.prefix}-${item.ref}`;
}

export function parseRef(board, text) {
  const match = String(text).trim().match(new RegExp(`^(?:${board.prefix}-?)?([0-9]+)$`, "i"));
  return match ? Number(match[1]) : null;
}

function normalizePriority(value) {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function validate(item) {
  if (!item.title) throw new Error("item sem título");
  if (!STATUSES.includes(item.status)) throw new Error(`status inválido: ${item.status}`);
  if (!PRIORITIES.includes(item.priority)) throw new Error(`prioridade inválida: ${item.priority}`);
}

export function sortItems(items) {
  return [...items].sort(
    (a, b) =>
      STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) ||
      PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority) ||
      a.ref - b.ref,
  );
}

export function listItems(board, { all = false } = {}) {
  return sortItems(all ? board.items : board.items.filter((item) => OPEN.includes(item.status)));
}

export function findItem(board, text) {
  const ref = parseRef(board, text);
  return board.items.find((item) => item.ref === ref) ?? null;
}

export function pickFields(options) {
  const out = {};
  for (const field of FIELDS) if (options[field] !== undefined) out[field] = options[field];
  if (out.priority !== undefined) out.priority = normalizePriority(out.priority);
  return out;
}

// Cria um item novo ou, com `update`, altera o item existente. Devolve { board, item }.
export function saveItem(board, fields, update, now = new Date().toISOString()) {
  if (update) {
    const current = findItem(board, update);
    if (!current) throw new Error(`não achei ${update}`);
    const item = { ...current, ...fields, updatedAt: now };
    validate(item);
    return { board: { ...board, items: board.items.map((i) => (i.ref === item.ref ? item : i)) }, item };
  }
  const ref = board.items.reduce((max, i) => Math.max(max, i.ref), 0) + 1;
  const item = { ref, status: "{{ST_FILA}}", priority: "media", area: "geral", kind: "task", ...fields, createdAt: now, updatedAt: now };
  validate(item);
  return { board: { ...board, items: [...board.items, item] }, item };
}

export function formatLine(board, item) {
  const head = `${code(board, item).padEnd(6)} ${item.status.padEnd(8)} ${item.priority.padEnd(6)} [${item.area}] ${item.title}`;
  return item.summary ? `${head}\n       ${item.summary}` : head;
}
