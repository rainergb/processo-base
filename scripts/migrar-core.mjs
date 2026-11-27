// Migração do projetos.json antigo ({ nome: { path, vars } }) para o atual ({ nome: caminho })
// com um docs/processo/config.json por projeto. Função pura: o script só lê e grava.

export const WRITING_LANGS_DEFAULT = "Código e nomes em inglês, comentários e docs em português.";

export function migrateProjects(raw, { dono, semTravessao = false } = {}) {
  if (!dono) throw new Error("dono obrigatório: passe --dono <nome>");
  const result = { projects: {}, configs: {} };
  for (const [nome, project] of Object.entries(raw)) {
    if (typeof project === "string") throw new Error(`projeto '${nome}' já está no formato novo`);
    if (!project?.path) throw new Error(`projeto '${nome}' sem path`);
    result.projects[nome] = String(project.path).replace(/\\/g, "/");
    result.configs[nome] = {
      name: nome,
      vars: {
        OWNER: dono,
        PROJECT_NAME: nome,
        NO_EM_DASH: semTravessao,
        WRITING_LANGS: WRITING_LANGS_DEFAULT,
        ...project.vars,
      },
    };
  }
  return result;
}
