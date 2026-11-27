// Renderizador mínimo de template: {{VAR}}, blocos {{#if FLAG}}...{{/if}} e
// {{#unless FLAG}}...{{/unless}} (sem aninhar o mesmo tipo).
// Variável ou flag não definida é erro: melhor falhar do que gerar doc com "{{...}}" sobrando.

// Bloco em linhas próprias ({{#if X}} seguido de quebra) some junto com a quebra do fechamento.
// Bloco dentro de uma linha preserva a quebra que vem depois dele.
function block(template, tag, vars, keepWhen) {
  const pattern = new RegExp(`\\{\\{#${tag} (\\w+)\\}\\}(\\n?)([\\s\\S]*?)\\{\\{\\/${tag}\\}\\}(\\n?)`, "g");
  return template.replace(pattern, (_match, flag, openBreak, body, closeBreak) => {
    if (!(flag in vars)) throw new Error(`flag não definida: ${flag}`);
    const tail = openBreak ? "" : closeBreak;
    return (Boolean(vars[flag]) === keepWhen ? body : "") + tail;
  });
}

export function render(template, vars) {
  const withBlocks = block(block(template, "if", vars, true), "unless", vars, false);
  return withBlocks.replace(/\{\{(\w+)\}\}/g, (_match, name) => {
    if (!(name in vars)) throw new Error(`variável não definida: ${name}`);
    return String(vars[name]);
  });
}
