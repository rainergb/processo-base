---
name: rotina-backlog
description: Rotina do quadro {{PREFIX}}-N. Pega o que está em andamento (ou, se vazio, promove da fila) e roda até {{AGENT_CAP}} agentes por vez. Invocação explícita apenas.
disable-model-invocation: true
---

<!-- GERADO por processo-base. Não edite aqui: mude em processo-base/nucleo e rode `npm run sync` lá. -->

# Rotina do backlog

Você é o líder. Siga o processo do `docs/processo/AGENTS-NUCLEO.md`. Esta rotina só automatiza a leitura do quadro e a distribuição entre agentes.

## 1. Escolher a fila

0. Comece lendo `{{HANDOFF_PATH}}` (o `AGENTS.md` já entra sozinho na sessão).
1. `{{BOARD_LIST_CMD}}` e separe os itens `{{ST_ANDAMENTO}}`. Ordene por status e, dentro dele, por prioridade (alta primeiro).{{#if LEADER_MODEL}} Cada item mostra `[modelo ...]` quando o {{PREFIX}}-N tem modelo líder cadastrado.{{/if}}
2. Primeiro entram os `{{ST_ANDAMENTO}}` aptos (sem passo manual pendente e sem agente já rodando neles). Se sobrarem vagas (ver seção 2) ou se não houver nenhum `{{ST_ANDAMENTO}}`, complete com itens de `{{ST_FILA}}` de prioridade alta e média, alta primeiro, só até preencher as vagas, e grave-os como `{{ST_ANDAMENTO}}` com {{BOARD_SET_STATUS}}. Nunca promova mais itens do que há vagas.
3. Nunca puxe item cuja proposta {{OWNER}} ainda não aprovou, item de decisão (título começando com "Decisão") nem item `{{ST_TESTE}}`.
4. Item `{{ST_ANDAMENTO}}` que depende de passo manual de {{OWNER}} (SQL, celular, decisão) fica como está: pule e reporte no fim.

## 2. Contar vagas antes de disparar

O teto de {{AGENT_CAP}} vale para tudo o que já está rodando, não só para o que esta rotina abriu.

1. Antes de disparar qualquer agente, liste os que já trabalham: `ListAgents` (subagentes, outras sessões locais da máquina) e `mcp__ccd_session_mgmt__list_sessions` com `linked: true`. Conte só os que estão ocupados, não os ociosos nem arquivados.
2. Vagas = {{AGENT_CAP}} menos os agentes ocupados. Sem vaga, não dispare nenhum e reporte que a fila está cheia.
3. Reconte a cada vez que um agente terminar, antes de abrir o próximo.
4. Na dúvida se um agente está ocupado, trate como ocupado.
5. Um item `{{ST_ANDAMENTO}}` que já tem agente ou branch `feat/{{PREFIX_LOWER}}-N-*` em andamento não recebe outro agente.

## 3. Rodar, no máximo {{AGENT_CAP}} por vez

- Leia cada item com `{{BOARD_ONE_CMD}}` e use "Arquivos" e "Pronto quando".
- Dois itens só rodam juntos se os arquivos não se sobrepõem. Na dúvida, rode em sequência.
- Cada especialista fica em branch própria `feat/{{PREFIX_LOWER}}-N-slug`, sem merge nem push, e entrega com {{CHECK_CMD}} passando.
{{#if LEADER_MODEL}}
- **Modelo do agente vem do item.** Leia o `[modelo ...]` do {{PREFIX}}-N (campo "Modelo líder"). Com mais de um marcado, use o mais barato (haiku, depois sonnet, depois opus). Modelo que não é Claude é ignorado (o processo usa só Claude); se for o único, pule o item e reporte. Item sem modelo cadastrado usa Sonnet. O modelo cadastrado é a decisão de {{OWNER}}: não suba nem desça por conta própria.
{{/if}}{{#unless LEADER_MODEL}}
- Especialista usa Sonnet. Nunca suba para Opus por conta própria.
{{/unless}}
- Subagentes de leitura usam `model: haiku`.
{{#if TESTER_TODAS}}- Toda prioridade passa por testador cego.
{{/if}}{{#unless TESTER_TODAS}}- Prioridade alta passa por testador cego. Média e baixa, não.
{{/unless}}
- Ao terminar um agente, abra o próximo da fila (nunca mais de {{AGENT_CAP}} ao mesmo tempo).

## 4. Fechar

- Revise o diff{{#if MERGE_DONO}}, peça o OK de {{OWNER}} para o merge e o push (regras de Git do núcleo) e só então mergeie e marque `{{ST_FEITO}}`{{/if}}{{#unless MERGE_DONO}}, mergeie na main quando os checks e o teste funcional passaram (regras de Git do núcleo) e marque `{{ST_FEITO}}`{{/unless}}. Se falta conferência de {{OWNER}}, marque `{{ST_TESTE}}`.
- Atualize `{{HANDOFF_PATH}}` (até 40 linhas).
- Relatório final curto: o que foi feito, o que foi pulado e por quê, o que depende de {{OWNER}}.
