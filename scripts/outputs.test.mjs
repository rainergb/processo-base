import assert from "node:assert/strict";
import { test } from "node:test";
import { outputsFor } from "./outputs.mjs";

const files = ["CLAUDE.md", "scripts/front-comments.mjs"];

test("arquivo condicional só vai com a flag ligada", () => {
  assert.deepEqual(outputsFor(files, { NO_UI_COMMENTS: true }), files);
  assert.deepEqual(outputsFor(files, { NO_UI_COMMENTS: false }), ["CLAUDE.md"]);
});

test("flag de arquivo condicional não definida falha", () => {
  assert.throws(() => outputsFor(files, {}), /NO_UI_COMMENTS/);
});
