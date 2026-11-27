import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyBoard, findItem, listItems, pickFields, saveItem } from "../modelos/projeto/scripts/backlog-core.mjs";

const NOW = "2026-11-27T00:00:00.000Z";

test("cria itens com ref sequencial e padrões", () => {
  let { board, item } = saveItem(emptyBoard("M"), { title: "a" }, undefined, NOW);
  assert.equal(item.ref, 1);
  assert.equal(item.status, "todo");
  ({ board, item } = saveItem(board, { title: "b" }, undefined, NOW));
  assert.equal(item.ref, 2);
  assert.equal(board.items.length, 2);
});

test("atualiza pelo código com ou sem prefixo", () => {
  const { board } = saveItem(emptyBoard("M"), { title: "a" }, undefined, NOW);
  assert.equal(saveItem(board, { status: "doing" }, "M-1", NOW).item.status, "doing");
  assert.equal(saveItem(board, { status: "doing" }, "1", NOW).item.status, "doing");
  assert.throws(() => saveItem(board, { status: "x" }, "M-1", NOW), /status/);
  assert.throws(() => saveItem(board, {}, "M-9", NOW), /M-9/);
});

test("lista abertos ordenados por status e prioridade", () => {
  let board = emptyBoard("M");
  for (const fields of [
    { title: "ideia", status: "idea" },
    { title: "feito", status: "done" },
    { title: "baixa", priority: "baixa" },
    { title: "alta", priority: "alta" },
    { title: "andando", status: "doing" },
  ]) board = saveItem(board, fields, undefined, NOW).board;
  assert.deepEqual(listItems(board).map((i) => i.title), ["andando", "alta", "baixa", "ideia"]);
  assert.equal(listItems(board, { all: true }).length, 5);
  assert.equal(findItem(board, "m-5").title, "andando");
});

test("prioridade aceita acento e maiúscula", () => {
  assert.equal(pickFields({ priority: "Média" }).priority, "media");
});
