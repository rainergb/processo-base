---
name: iniciar
description: Aplica o processo-base no projeto do diretório atual. Faz uma entrevista curta e depois gera os arquivos de processo (CLAUDE.md, docs/processo/, skills).
disable-model-invocation: true
---

# /processo:iniciar

Aplica o processo no projeto atual. Se o projeto já tem `docs/processo/config.json`, não sobrescreva: use `/processo:sincronizar`.

## Verificação inicial

1. Verifique se `docs/processo/config.json` já existe no diretório atual.
   - Se sim: "Este projeto já tem o processo configurado. Use `/processo:sincronizar` para atualizar os arquivos gerados."
   - Se não: continue.

## Entrevista

Faça estas perguntas, uma de cada vez (não liste tudo de uma vez):

1. **Dono do projeto:** "Qual é o seu nome? (Será usado como OWNER nas regras do processo, ex: quem aprova, quem decide)"
2. **Prefixo do quadro:** "Qual prefixo usar para os itens do quadro? (1 a 3 letras maiúsculas, ex: P para P-12, A para A-5)"
3. **Comando de checks:** "Qual o comando que roda todos os checks do projeto? (ex: `npm run check`, `tsc && eslint && npm test`)"
4. **Pasta de lógica pura:** "Onde fica a lógica pura (funções testáveis sem DOM)? (ex: `src/lib`, `packages/core`)"
5. **Testes e2e:** "O projeto tem testes e2e? (s/n)"
6. **Design system:** "O projeto usa design system? (s/n) Se sim, onde fica? (ex: `src/components/ui`, `packages/ui`)"
7. **Regra de código de tela sem comentários:** "Quer proibir comentários em código de tela (componentes, hooks, páginas)? (s/n)"
8. **Regra do travessão:** "Quer proibir o uso do travessão (—) em código, docs e commits? (s/n)"

## Execução

Com as respostas, monte o comando e execute:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/novo.mjs" \
  --nome <nome-do-diretorio-atual> \
  --caminho . \
  --prefixo <PREFIXO> \
  --dono "<DONO>"
```

Depois ajuste `docs/processo/config.json` conforme as respostas (CHECK_CMD, PURE_LOGIC_DIR, E2E, DESIGN_APPROVAL, DESIGN_SYSTEM_WHERE, DESIGN_PLACES, NO_UI_COMMENTS, NO_EM_DASH).

## Resultado

Informe o que foi criado (arquivos de processo, skills, modelos) e lembre:

- Revise `docs/processo/config.json` e ajuste as variáveis.
- Arquivos gerados (CLAUDE.md, docs/processo/AGENTS-NUCLEO.md, skills) não se editam no projeto: mudou o processo, rode `/processo:sincronizar`.
- Para registrar este projeto na lista pessoal do processo-base (modo multi-projeto), rode `node "${CLAUDE_PLUGIN_ROOT}/scripts/novo.mjs" --registrar ...` ou edite `projetos.json` manualmente.
