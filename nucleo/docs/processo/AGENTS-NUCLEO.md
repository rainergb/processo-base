<!-- GERADO por processo-base. Não edite aqui: mude em processo-base/nucleo e rode `npm run sync` lá. -->

# Processo (núcleo compartilhado)

# Escrita

{{#if NO_EM_DASH}}
- **Nunca usar travessão (—)** em código, comentários, docs, commits ou mensagens.
{{/if}}
- {{WRITING_LANGS}}

# Modelos

Sempre modelos da Anthropic (Claude). **Sonnet é o padrão de toda sessão.** Opus ou Fable só
para planejar (entrevista, spec, revisão de processo). Haiku para ler, buscar e testar:
subagente de leitura ou busca vai com `model: haiku`. Nunca subir para Opus "por garantia" na
hora de executar: a cota de uso acaba muito mais rápido.

**Teto de agentes: no máximo {{AGENT_CAP}} trabalhando ao mesmo tempo**, e o segundo só se não
tocar nos mesmos arquivos. A cota de uso é dividida entre todos.

**Agentes aninhados ao líder:** todo especialista e testador é filho da sessão do líder, nunca
sessão solta. Assim o teto é contável (a cota estourou com muitos agentes em paralelo).

**Navegador e controle de tela só quando não houver caminho mais barato.** Ordem de
preferência:

1. CLI, API e scripts.
2. Ler página como texto (`get_page_text`, `read_page`) em vez de screenshot.
3. Navegador embutido, só para ver o app local (dev server).
4. Claude in Chrome, só se precisar do login real de {{OWNER}}.
5. Controle de tela (`computer-use`), só para app nativo sem outra via.

Screenshot custa muito: um print como evidência final em item de prioridade alta, nunca para
explorar.

# Processo: líder, especialista e testador

1. **Líder (sessão principal):** entrevista, cria o {{PREFIX}}-N, escreve o "Pronto quando" como
   contrato verificável ("abrir X, clicar em Y, ver Z"). Planeja, revisa e mergeia. Não
   implementa quando houver especialista disponível; ajuste trivial (uma linha, texto, nome) o
   líder faz direto, porque abrir um agente para isso gasta mais token do que a mudança.
2. **Especialista:** trabalha na própria branch, sem merge nem push. Entrega com
   {{CHECK_CMD}} passando.
3. **Testador cego (só prioridade alta):** recebe só a branch e o {{PREFIX}}-N, nunca o diff. Sobe o
   app, {{#if E2E}}roda o e2e, {{/if}}testa item por item do "Pronto quando" e anexa prints.
   Aprova ou recusa com passos para reproduzir. Prioridade média e baixa não levam testador:
   valem os checks do especialista, o teste de regressão `{{PREFIX}}-N` e a conferência de
   {{OWNER}} no status `testing`.

**Fluxo:** líder cria o {{PREFIX}}-N, delega ao especialista, revisa o diff, delega ao testador
(só prioridade alta); aprovado, mergeia na main e sobe, juntando entregas num push só.

Recusa volta para a mesma sessão do especialista. Após 2 recusas, o líder revê a especificação.

**Relatório do líder só sob pedido** (custa token em toda tarefa). Quando {{OWNER}} pedir status,
o líder informa tempo gasto por etapa, quantos agentes trabalham, tempo previsto de cada um e o
modelo de cada um. Status de um {{PREFIX}}-N é uma checklist do que foi feito e do que falta.

Para rodar o quadro em fila respeitando o teto de agentes, use a skill `/rotina-backlog`.

# Sessão curta e handoff

- **Uma sessão por {{PREFIX}}-N.** Mergeou, encerra (`/clear` ou sessão nova).
- Passou de uns 100k tokens ou de 2 itens na mesma conversa: `/compact` ou sessão nova.
- **Ao encerrar,** atualize `{{HANDOFF_PATH}}` no formato de `docs/processo/HANDOFF-MODELO.md`:
  até 40 linhas, só o que a próxima sessão precisa. O plano fica no {{PREFIX}}-N e o handoff
  aponta para ele, sem duplicar.
- **Trocou de conta ou de sessão?** O histórico da conversa não vai junto, só o repositório.
  Por isso a sessão nova começa lendo o HANDOFF e o {{PREFIX}}-N, nada mais.

# Quadro {{PREFIX}}-N

{{BOARD_DESCRIPTION}}

```
{{BOARD_COMMANDS}}
```

- **Toda pendência tem um {{PREFIX}}-N.** "Resolve o {{PREFIX}}-12" → primeira ação: `{{BOARD_ONE_CMD}}`.
{{#if BOARD_LINK}}
- **Link do item:** `{{BOARD_LINK}}`.
{{/if}}
- **Antes de começar:** liste o que está aberto; o pedido pode já ser um item. Pedido novo vira
  item antes do código (exceto ajuste trivial).
- **Um item por problema.** Achou três bugs, são três {{PREFIX}}-N. Plano com etapas é um item por
  etapa, mesma área, numerada.
- **Criar sem perguntar:** bug, risco ou ideia que aparece no caminho vira item na hora.
  Decisão de {{OWNER}} vira item próprio, prioridade alta, com opções e recomendação.
- **Descrição de todo item** (markdown): **Problema**, **Arquivos**, **Pronto quando**
  (checklist verificável), **Decisões** (o que, quem, quando).
- **Prioridade:** alta = trava, perde dado ou desloga; média = funciona errado ou confuso;
  baixa = visual ou texto.
- **Status:** `idea` Ideia, `todo` A fazer, `doing` Em andamento, `testing` Testes (testador e
  depois {{OWNER}}, ou esperando o OK para merge), `done` Feito (mergeado na main),
  `dropped` Descartado. Se faltar passo manual (SQL, celular), fica `doing` com o passo no
  checklist.
- **Plano fica no item.** Doc em `docs/` só para assunto longo; o item aponta, sem duplicar.

# Git

- Commit começa pelo código: `{{PREFIX}}-12 feat(widgets): contrato de widget`. Tipos: feat, fix,
  refactor, chore, docs, test.
- Uma branch por {{PREFIX}}-N: `feat/{{PREFIX_LOWER}}-12-contrato-widget`.
- Merge na main sem perguntar quando {{CHECK_CMD}} e o teste funcional passaram. Pergunte antes
  se mexer em banco de produção ou dado de usuário, ou se for algo arriscado.
- Mensagem do merge: `{{PREFIX}}-12, {{PREFIX}}-15: merge feat/... na main`, corpo com uma linha
  por {{PREFIX}}-N.
- **Push em lote:** junte os commits de uma etapa num push só.
- **Worktree separada** se a pasta tiver mudança alheia.

# Testes

- **Bug corrigido vem com teste de regressão** que falha antes e passa depois, com nome
  `it("{{PREFIX}}-12: ...")`. Escreva o teste com o caso real, veja-o falhar, corrija, veja-o
  passar. Falha de dependência externa também é caso de teste. Commit da correção leva o teste junto.
- **Nunca apague nem afrouxe teste `{{PREFIX}}-N`.** Se o comportamento mudou, ajuste e anote a
  decisão no item.
- **Lógica fora da tela.** Decisão e regra de negócio vão para função pura em `{{PURE_LOGIC_DIR}}`
  com teste ao lado; o componente só chama a função.
{{#if SEARCH_FIRST}}

# UI nova passa pelo design system antes

1. **Procure antes de criar.** Procure em {{DESIGN_PLACES}}. Se existe com pequena mudança,
   adapte, não copie.
{{/if}}{{#if DESIGN_APPROVAL}}
2. **Novo vai para o design system primeiro** ({{DESIGN_SYSTEM_WHERE}}), marcado "Aguardando
   aprovação". O item ganha uma decisão "aprovar UI X no design system", prioridade alta. Só
   depois da aprovação entra nas telas.
3. **Aprovado = registrado.** Aprovação ou ajuste vai para {{DECISIONS_WHERE}}, com data.
{{/if}}{{#if NO_UI_COMMENTS}}

# Código de tela sem comentários

Em {{UI_COMMENT_SCOPE}} **não se escreve comentário**, nem `//`, `/* */`, JSDoc ou `{/* */}` no
JSX. Exceção: diretiva de ferramenta (`eslint-disable-next-line`, `@ts-expect-error`).

Fora da regra: {{UI_COMMENT_OUTSIDE}} mantêm comentários. Verificação: `npm run lint:comments`
(remove sozinho com `npm run lint:comments -- --write`).
{{/if}}
