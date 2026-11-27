import assert from "node:assert/strict";
import { test } from "node:test";
import { render } from "./render.mjs";

test("substitui variáveis", () => {
  assert.equal(render("item {{PREFIX}}-12", { PREFIX: "A" }), "item A-12");
});

test("mantém o bloco quando a flag é verdadeira", () => {
  assert.equal(render("a{{#if X}}b{{/if}}c", { X: true }), "abc");
});

test("remove o bloco quando a flag é falsa", () => {
  assert.equal(render("a\n{{#if X}}\nb\n{{/if}}\nc", { X: false }), "a\nc");
});

test("variável não definida falha", () => {
  assert.throws(() => render("{{FALTA}}", {}), /FALTA/);
});

test("flag não definida falha", () => {
  assert.throws(() => render("{{#if FALTA}}x{{/if}}", {}), /FALTA/);
});

test("unless mantém o bloco quando a flag é falsa", () => {
  assert.equal(render("a{{#unless X}}b{{/unless}}c", { X: false }), "abc");
});

test("unless remove o bloco quando a flag é verdadeira", () => {
  assert.equal(render("a\n{{#unless X}}\nb\n{{/unless}}\nc", { X: true }), "a\nc");
});

test("if e unless da mesma flag no mesmo template", () => {
  const t = "{{#if X}}sim{{/if}}{{#unless X}}não{{/unless}}";
  assert.equal(render(t, { X: true }), "sim");
  assert.equal(render(t, { X: false }), "não");
});

test("string vazia conta como flag desligada", () => {
  assert.equal(render("a{{#if LINK}}[{{LINK}}]{{/if}}b", { LINK: "" }), "ab");
  assert.equal(render("a{{#if LINK}}[{{LINK}}]{{/if}}b", { LINK: "x" }), "a[x]b");
});

test("bloco dentro da linha preserva a quebra seguinte", () => {
  assert.equal(render("a.{{#if X}} b.{{/if}}\nc", { X: true }), "a. b.\nc");
  assert.equal(render("a.{{#if X}} b.{{/if}}\nc", { X: false }), "a.\nc");
});
