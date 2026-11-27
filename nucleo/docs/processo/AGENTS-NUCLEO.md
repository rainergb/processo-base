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

**Agentes aninhados ao líder:** todo analista, especialista e testador é filho da sessão do líder, nunca
sessão solta. Assim o teto é contável (a cota estourou com muitos agentes em paralelo). **Sessão filha
ligada ao líder conta no teto**, tenha ela nascido de subagente ou de sessão iniciada pelo líder.

**Exceção de modelo:** o analista de proposta roda em Opus (é planejamento, só lê). Especialista e
testador seguem em Sonnet.

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

Os agentes estão em `.claude/agents/` (`analista-proposta`, `especialista`, `testador`) e os modelos de
brief e de relatório em `docs/processo/BRIEF-MODELO.md` e `docs/processo/RELATORIO-TESTE-MODELO.md`.

1. **Líder (sessão principal):** entrevista, cria o {{PREFIX}}-N, pede a proposta, leva a {{OWNER}} para
   aprovar e transforma os critérios em contrato verificável ("abrir X, clicar em Y, ver Z"). Planeja e
   revisa{{#unless MERGE_DONO}}, e mergeia{{/unless}}. Não implementa quando houver especialista
   disponível; ajuste trivial (uma linha, texto, nome) o líder faz direto, porque abrir um agente para
   isso gasta mais token do que a mudança.
2. **Analista de proposta:** só lê. Devolve a proposta (ver "Proposta antes do código").
3. **Especialista:** trabalha na própria branch, sem merge nem push. Entrega com
   {{CHECK_CMD}} passando, teste de regressão e o app no ar com a URL.
4. **Testador cego{{#unless TESTER_TODAS}} (só prioridade alta){{/unless}}:** recebe só o card, os critérios e
   a URL, nunca o diff nem o código, e só tem ferramentas do navegador embutido. Testa a URL que o
   especialista deixou no ar, item por item do "Pronto quando", em desktop e em 375 px.
   {{#if E2E}}O e2e roda com o especialista. {{/if}}Aprova (APROVADO) ou recusa (RECUSADO) com passos para
   reproduzir.{{#unless TESTER_TODAS}} Prioridade média e baixa não levam testador: valem os checks do
   especialista, o teste de regressão `{{PREFIX}}-N` e a conferência de {{OWNER}} na situação
   `{{ST_TESTE}}`.{{/unless}}{{#if TESTER_TODAS}} Toda prioridade passa pelo testador.{{/if}}

**Fluxo:** líder cria o {{PREFIX}}-N, pede a proposta ao analista, {{OWNER}} aprova, o líder delega ao
especialista, revisa o diff e delega ao testador{{#unless TESTER_TODAS}} (só prioridade alta){{/unless}};
{{#if MERGE_DONO}}aprovado, o líder pede o OK de {{OWNER}} para o merge e o push.{{/if}}{{#if FLUXO_LOTE}}aprovado, mergeia na main e sobe, juntando entregas num push só.{{/if}}{{#if FLUXO_SIMPLES}}aprovado, mergeia na main e sobe.{{/if}}

Recusa volta para a mesma sessão do especialista. Após 2 recusas, o líder revê a especificação.

**Relatório do líder só sob pedido** (custa token em toda tarefa). Quando {{OWNER}} pedir status,
o líder informa tempo gasto por etapa, quantos agentes trabalham, tempo previsto de cada um e o
modelo de cada um. Status de um {{PREFIX}}-N é uma checklist do que foi feito e do que falta.

Para rodar o quadro em fila respeitando o teto de agentes, use a skill `/rotina-backlog`.

# Proposta antes do código

Nenhuma mudança começa sem proposta aprovada por {{OWNER}} (exceto ajuste trivial).

1. O líder pede ao `analista-proposta` (só leitura) a proposta do {{PREFIX}}-N: causa, arquivos, opções
   com recomendação, **correção mínima**, **achados extras**, estimativa e **critérios de pronto**.
2. Os critérios de pronto são escritos em palavras de usuário ("abrir X, tocar em Y, ver Z"), sem citar
   código. Viram o "Pronto quando" do item e são **o contrato**: o testador cego verifica exatamente eles.
3. {{OWNER}} aprova a proposta (e escolhe a opção) antes de qualquer especialista começar. A aprovação e a
   data ficam registradas no item. Mudou o escopo no meio? Nova proposta, nova aprovação.

# Correção mínima

- O PR leva **só o necessário** para o {{PREFIX}}-N. Nada de refactor, formatação ou "já que estou aqui".
- Achou outro problema? **Não conserte no mesmo PR.** Vira um item novo e fica listado em "Achados extras"
  do item de origem, com título e problema, para {{OWNER}} priorizar.

# Segurança

- **Produção e bancos reais só leitura**, e só com {{OWNER}} sabendo. Escrita só em banco local ou de teste.
- **Credencial nunca em texto:** em docs, commit, item ou mensagem, cite só o arquivo e a linha onde está.
- **Nunca ler `.env`** nem arquivo equivalente com segredo. Para saber quais variáveis existem, leia o
  `.env.example`.
- **Dado real de cliente fora de `docs/`**, de commit, de teste e de print. Só dados fictícios.

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
  (checklist verificável), **Decisões** (o que, quem, quando) e **Achados extras** (o que apareceu e ficou
  fora do PR, cada um com seu {{PREFIX}}-N).
- **Prioridade:** alta = trava, perde dado ou desloga; média = funciona errado ou confuso;
  baixa = visual ou texto.
- **Situações** (configuráveis em `SITUACOES` no `docs/processo/config.json`): {{SITUACOES_TEXTO}}.
  O item anda uma situação por vez e a situação é a verdade sobre onde ele está. Se faltar passo manual (SQL,
  celular), ele fica em `{{ST_ANDAMENTO}}` com o passo no checklist.
{{#if POS_DEPLOY}}- **Verificação pós-deploy:** mergeado não é finalizado. Depois do deploy, confira em produção, só
  leitura, que o comportamento do "Pronto quando" apareceu; só então o item vai para a situação final.
{{/if}}
- **Plano fica no item.** Doc em `docs/` só para assunto longo; o item aponta, sem duplicar.

# Git

{{#if COMMIT_CONVENTIONAL}}- Commit em Conventional Commits, com o item no fim: `fix: corrige filtro de data ({{PREFIX}}-12)`.
  Tipos: feat, fix, refactor, chore, docs, test.
{{/if}}{{#unless COMMIT_CONVENTIONAL}}- Commit começa pelo código: `{{PREFIX}}-12 feat(widgets): contrato de widget`. Tipos: feat, fix,
  refactor, chore, docs, test.
{{/unless}}
- Uma branch por {{PREFIX}}-N: `feat/{{PREFIX_LOWER}}-12-contrato-widget`.
{{#if MERGE_DONO}}- **Merge e push só com OK de {{OWNER}}.** O líder apresenta o diff, os checks e o veredito do
  testador e espera a aprovação explícita de {{OWNER}}; sem ela, a branch fica pronta e parada. Nenhum
  agente faz merge nem push por conta própria.
{{/if}}{{#unless MERGE_DONO}}- Merge na main sem perguntar quando {{CHECK_CMD}} e o teste funcional passaram. Pergunte antes
  se mexer em banco de produção ou dado de usuário, ou se for algo arriscado.
{{/unless}}
- Mensagem do merge: `{{PREFIX}}-12, {{PREFIX}}-15: merge feat/... na main`, corpo com uma linha
  por {{PREFIX}}-N.
{{#if PUSH_OK_DONO}}- **Push só com OK de {{OWNER}}**, com os commits da etapa juntos num push só.
{{/if}}{{#unless PUSH_OK_DONO}}- **Push em lote:** junte os commits de uma etapa num push só.
{{/unless}}
- **Worktree separada** se a pasta tiver mudança alheia.

{{#if MULTI_REPO}}# Vários repositórios

Este projeto cobre {{REPOS_TEXTO}}. O item diz em qual repositório cada mudança acontece; uma branch por
repositório, com o mesmo {{PREFIX}}-N no nome. Commit, merge e push valem por repositório. O painel
(`npm run mapa`) lê todos eles.

{{/if}}# Testes

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
