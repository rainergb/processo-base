---
name: improve-codebase-architecture
description: Varre o codebase procurando oportunidades de deepening (módulos rasos que viram profundos), apresenta num relatório HTML visual e depois aprofunda a que você escolher. Invocação explícita apenas.
disable-model-invocation: true
---

<!-- GERADO por processo-base. Não edite aqui: mude em processo-base/nucleo e rode `npm run sync` lá. -->

# Improve Codebase Architecture

Expor atrito arquitetural e propor **deepening opportunities**: refactors que
transformam modules shallow em modules deep. O alvo é testabilidade e navegabilidade
por IA.

Fontes de verdade deste projeto (leia antes de opinar):

- **[GLOSSARIO.md](GLOSSARIO.md)**: o vocabulário de arquitetura (**module**,
  **interface**, **depth**, **seam**, **adapter**, **leverage**, **locality**) e os
  princípios (deletion test, "a interface é a superfície de teste", "um adapter =
  seam hipotético, dois = real"). Use esses termos exatamente; não derive para
  "componente", "serviço", "camada" ou "fronteira".
- **`AGENTS.md`**: restrições do projeto e os **invariantes já fechados** (ex.:
  {{INVARIANTS_EXAMPLE}}). Um
  candidato nunca pode propor algo que quebre um invariante.
- **`{{ARCH_DOC}}`**: o modelo de domínio. Dá nome aos seams bons.
- **`docs/PADROES.md`**: padrões já decididos. Não relitigar.
- **`{{DECISIONS_DOC}}`**: o que está parado **e por quê**. Faz o papel dos ADRs:
  se um candidato já está listado ali com motivo, ou já foi rejeitado, não
  re-sugerir do zero.

## Restrição de custo (obrigatória)

`AGENTS.md` impõe economia de tokens: cota de uso, execução em lote, não re-auditar o
projeto inteiro a cada sessão. Portanto:

- **Escopo estreito por padrão.** Nunca varra `{{SRC_ROOT}}` inteiro sem o usuário pedir.
- **Um sub-agente, sequencial.** Não paralelizar múltiplos agentes de exploração ,
  eles dividem a mesma cota e brigam pelos mesmos arquivos.
- **Antes de varrer, diga o escopo e o custo estimado** e espere o ok. Ex.:
  "Vou olhar `{{PURE_LOGIC_DIR}}` (~12 arquivos), ⏱ ~6 min. Ok?"

## Processo

### 1. Explorar

**Escopo antes de varrer: YAGNI.** Deepening se paga tornando mudanças _futuras_
mais fáceis, então peso extra no que mudou recentemente. Decida _onde_ olhar antes
de olhar:

- Se o usuário nomeou uma direção (um module, um subsistema, uma dor), pegue essa e
  pule a inferência abaixo.
- Senão, use `git log --oneline -40` pra achar os hot spots: os arquivos que
  reaparecem: e deixe esses caminhos puxarem a atenção primeiro. Se as mudanças
  estiverem espalhadas sem hot spot claro, **pergunte** em vez de alargar a rede
  (alargar custa cota).

Leia `{{ARCH_DOC}}` e a seção relevante de `{{DECISIONS_DOC}}` antes de
tocar na área.

Depois lance **um** sub-agente pra percorrer o escopo acordado. Não siga heurística
rígida; explore organicamente e anote onde você sente atrito:

- Onde entender um conceito exige pular entre muitos modules pequenos?
- Onde os modules são **shallow**, com interface quase tão complexa quanto a
  implementação?
- Onde funções puras foram extraídas só por testabilidade, mas os bugs reais moram
  em _como_ elas são chamadas (sem **locality**)?{{#if LOCALITY_EXAMPLE}} Este projeto já teve exatamente
  isso: {{LOCALITY_EXAMPLE}}{{/if}}
- Onde modules acoplados vazam pelos seams?
- Que partes estão sem teste, ou difíceis de testar pela interface atual?

Aplique o **deletion test** em tudo que parecer shallow: apagar isso concentraria
complexidade ou só a moveria? "Concentra" é o sinal que interessa.

### 2. Apresentar candidatos como relatório HTML

Escreva um HTML auto-contido no **scratchpad da sessão** (o diretório indicado no
system prompt) ou, na falta dele, em `$TEMP` / `%TEMP%`: nunca dentro do repo.
Nome: `architecture-review-<timestamp>.html`, um arquivo novo por execução.
Abra pro usuário com `start "" "<caminho>"` (Windows; `open` no macOS, `xdg-open` no
Linux) e informe o caminho absoluto.

O relatório usa **Tailwind via CDN** pra layout e **Mermaid via CDN** pros diagramas
onde um grafo/fluxo/sequência comunica melhor. Misture Mermaid com CSS/SVG na mão:
Mermaid quando a relação é graph-shaped (grafo de chamadas, dependências,
sequências), divs/SVG na mão quando quiser algo mais editorial (diagrama de massa,
corte transversal, colapso). Cada candidato ganha uma visualização **antes/depois**.
Seja visual.

Cada candidato vira um card com:

- **Arquivos**: quais arquivos/modules estão envolvidos
- **Problema**: por que a arquitetura atual gera atrito
- **Solução**: em português claro, o que mudaria
- **Ganhos**: em termos de locality e leverage, e como os testes melhoram
- **Diagrama antes/depois**: lado a lado, desenhado à mão, mostrando a shallowness e
  o deepening
- **Força da recomendação**: `Forte`, `Vale explorar` ou `Especulativo`, como badge

Termine com **Recomendação principal**: qual candidato atacar primeiro e por quê.

**Vocabulário do domínio vem de `{{ARCH_DOC}}`; o de arquitetura vem de
[GLOSSARIO.md](GLOSSARIO.md).** Use o nome que o domínio usa
("o module de {{DOMAIN_TERM}}"), nunca um nome genérico inventado.

**Conflito com decisão já registrada**: se um candidato contradiz algo em
`docs/PADROES.md` ou `{{DECISIONS_DOC}}`, só traga se o atrito for real o bastante
pra justificar reabrir. Marque claramente no card (callout âmbar: _"contraria a
decisão X em {{DECISIONS_DOC_NAME}}, mas vale reabrir porque…"_). Não liste todo refactor
teórico que um padrão proíbe.

**Invariantes de `AGENTS.md` são intocáveis.** Um candidato que enfraqueça
{{INVARIANTS_EXAMPLE}} não entra no
relatório: nem como especulativo.

Veja [HTML-REPORT.md](HTML-REPORT.md) pro scaffold completo, padrões de diagrama e
estilo.

Ainda NÃO proponha interfaces. Depois de escrever o arquivo, pergunte: "Qual desses
você quer explorar?"

### 3. Loop de aprofundamento

Quando o usuário escolher um candidato, percorra a árvore de decisão com ele ,
uma pergunta por vez, sem despejar tudo de uma vez:

1. **Restrições**: o que não pode mudar? (invariante de `AGENTS.md`, formato
   persistido, contrato de rota já consumida)
2. **Dependências**: o que esse module precisa? Cada uma cai em: _in-process_
   (só chama), _local-substitutable_ (dá pra trocar por uma versão em memória),
   _ports & adapters_ (precisa de seam de verdade), _mock_ (último recurso).
3. **Forma do module deepened**: qual é a interface _menor_ que ainda serve todos
   os call sites? Escreva as assinaturas.
4. **O que fica atrás do seam**: o que a implementação absorve e some da interface.
5. **Que testes sobrevivem**: quais testes atuais continuam válidos pela nova
   interface, quais viram desnecessários (testavam o wrapper), quais faltam.

Se quiser explorar interfaces alternativas, faça **design-it-twice**: escreva duas
interfaces candidatas para o mesmo module, compare pelo deletion test e pela
superfície de teste, e escolha. Duas, não cinco: cota.

Efeitos colaterais acontecem inline, conforme as decisões fecham:

- **Nomeou o module deepened com um conceito que não está em `{{ARCH_DOC}}`?**
  Adicione o termo lá.
- **Afiou um termo vago durante a conversa?** Atualize `{{ARCH_DOC}}` na hora.
- **O usuário rejeitou o candidato com um motivo que carrega peso?** Ofereça
  registrar em `{{DECISIONS_DOC}}`, enquadrado como: _"Quero registrar isso em
  {{DECISIONS_DOC_NAME}} pra uma revisão futura não re-sugerir?"_. Só ofereça quando o motivo
  seria realmente necessário pra um explorador futuro; pule motivos efêmeros ("agora
  não vale") e óbvios.
- **Fechou uma etapa?** Marque o checkbox no doc da sprint correspondente: é o que
  permite retomar barato depois de estourar a cota.
