// Quais arquivos de nucleo/ vão para cada projeto.
import { readdirSync } from "node:fs";
import { join, relative } from "node:path";

// Arquivo que só vai para o projeto com a flag ligada.
export const CONDITIONAL = {
  "scripts/front-comments.mjs": "NO_UI_COMMENTS",
};

export function listTemplates(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listTemplates(full, base));
    else out.push(relative(base, full).replace(/\\/g, "/"));
  }
  return out.sort();
}

export function outputsFor(templates, vars) {
  return templates.filter((file) => {
    const flag = CONDITIONAL[file];
    if (!flag) return true;
    if (!(flag in vars)) throw new Error(`flag não definida: ${flag}`);
    return Boolean(vars[flag]);
  });
}
