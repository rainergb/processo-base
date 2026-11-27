---
name: sincronizar
description: Sincroniza os arquivos gerados do processo-base no projeto atual (CLAUDE.md, docs/processo/AGENTS-NUCLEO.md, skills). Leia docs/processo/config.json do projeto e aplica os templates mais recentes.
disable-model-invocation: true
---

# /processo:sincronizar

Atualiza os arquivos gerados pelo processo-base no projeto atual.

**Regra de ouro:** arquivo gerado não se edita no projeto. Mudou o processo, mude no repositório
do processo-base e rode este comando.

## Uso normal (atualizar)

Execute:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/sync.mjs" --project .
```

Isso lê `docs/processo/config.json` do projeto atual e regera os arquivos de processo
(CLAUDE.md, docs/processo/AGENTS-NUCLEO.md, docs/processo/HANDOFF-MODELO.md, skills em
`.claude/skills/`).

## Uso com --check (só conferir, sem escrever)

Quando o usuário pedir só conferência (ex: "está tudo em dia?"):

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/sync.mjs" --project . --check
```

Sai com código 0 se tudo em dia, 1 se algum arquivo divergiu.

## Se o projeto não tem config.json

Se `docs/processo/config.json` não existir, o comando falha com mensagem clara.
Nesse caso, use `/processo:iniciar` para configurar o projeto.

## Após sincronizar

Informe quais arquivos foram atualizados (ou que tudo já estava em dia). Lembre que as
variáveis de configuração ficam em `docs/processo/config.json` no projeto, e que esse
arquivo é commitado no repositório do projeto.
