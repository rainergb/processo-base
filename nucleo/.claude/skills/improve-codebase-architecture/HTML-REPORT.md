<!-- GERADO por processo-base. Não edite aqui: mude em processo-base/nucleo e rode `npm run sync` lá. -->

# Formato do relatório HTML

A revisão arquitetural vira um único arquivo HTML auto-contido, escrito no
scratchpad da sessão (ou em `%TEMP%`), nunca no repo. Tailwind e Mermaid vêm de CDN.
Mermaid resolve bem os diagramas graph-shaped; divs e SVG inline na mão resolvem os
mais editoriais (diagrama de massa, corte transversal). Misture os dois: não apoie
tudo no Mermaid, fica genérico.

## Scaffold

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Revisão de arquitetura: {{PROJECT_NAME}}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
      mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
    </script>
    <style>
      /* camada pequena pro que o Tailwind não cobre bem:
         linhas de seam tracejadas, setas com cara de desenho à mão, etc. */
      .seam {
        stroke-dasharray: 4 4;
      }
      .leak {
        stroke: #dc2626;
      }
      .deep {
        background: linear-gradient(135deg, #0f172a, #1e293b);
      }
    </style>
  </head>
  <body class="bg-stone-50 text-slate-900 font-sans">
    <main class="max-w-5xl mx-auto px-6 py-12 space-y-12">
      <header>...</header>
      <section id="candidatos" class="space-y-10">...</section>
      <section id="recomendacao-principal">...</section>
    </main>
  </body>
</html>
```

## Header

Nome do repo, data e uma legenda compacta: caixa sólida = module, linha tracejada =
seam, seta vermelha = vazamento, caixa escura grossa = module deep. Sem parágrafo de
introdução. Direto pros candidatos.

## Card de candidato

Os diagramas carregam o peso. O texto é esparso, direto, e usa os termos do
[GLOSSARIO.md](GLOSSARIO.md) sem cerimônia.

Cada candidato é um `<article>`:

- **Título**: curto, nomeia o deepening (ex.: "Colapsar o pipeline de watch-actions").
- **Linha de badges**: força da recomendação (`Forte` = emerald, `Vale explorar` =
  amber, `Especulativo` = slate), mais uma tag da categoria de dependência
  (`in-process`, `local-substitutable`, `ports & adapters`, `mock`).
- **Arquivos**: lista monoespaçada, `font-mono text-sm`.
- **Antes / Depois**: a peça central. Duas colunas, lado a lado. Padrões abaixo.
- **Problema**: uma frase. O que dói.
- **Solução**: uma frase. O que muda.
- **Ganhos**: bullets, ≤6 palavras cada. Ex.: "Testes batem numa interface só",
  "Progresso para de vazar", "Apaga 4 wrappers shallow".
- **Callout de conflito** (se aplicável): uma linha em caixa âmbar, citando
  `docs/PADROES.md` ou `docs/PENDENCIAS.md`.

Sem parágrafos de explicação. Se o diagrama precisa de um parágrafo pra ser
entendido, redesenhe o diagrama.

## Padrões de diagrama

Escolha o padrão que serve ao candidato. Misture. Não faça todos os diagramas iguais
, a variedade é parte do ponto.

### Grafo Mermaid (o cavalo de batalha pra dependências / fluxo de chamada)

Use `flowchart` ou `graph` quando o ponto é "X chama Y chama Z, e olha a bagunça".
Embrulhe num card do Tailwind pra não parecer paraquedado. Use `classDef` pra pintar
as arestas de vazamento de vermelho e o module deep de escuro. Diagramas de sequência
funcionam bem pra "antes: 6 idas e voltas; depois: 1".

```html
<div class="rounded-lg border border-slate-200 bg-white p-4">
  <pre class="mermaid">
    flowchart LR
      A[EpisodeRow] --> B[store.toggleEpisode]
      B --> C[library_items]
      C -.vaza.-> D[Explorar / For You]
      classDef leak stroke:#dc2626,stroke-width:2px;
      class C,D leak
  </pre>
</div>
```

### Caixas e setas na mão (quando o layout do Mermaid briga com você)

Modules como `<div>`s com borda e label. Setas como `<line>` ou `<path>` SVG inline,
posicionados em absoluto sobre um container relativo. Use quando quiser que o
diagrama "depois" pareça um module deep de borda grossa com os internos acinzentados
, o Mermaid não renderiza isso com o peso certo.

### Corte transversal (bom pra shallowness em camadas)

Empilhe faixas horizontais (`h-12 border-l-4`) mostrando as camadas por onde uma
chamada passa. Antes: 6 camadas finas, cada uma sem fazer nada. Depois: 1 faixa
grossa, rotulada com a responsabilidade consolidada.

### Diagrama de massa (bom pra "interface tão larga quanto a implementação")

Dois retângulos por module: um pra área da interface, outro pra implementação.
Antes: o retângulo da interface quase tão alto quanto o da implementação (shallow).
Depois: interface baixa, implementação alta (deep).

### Colapso do grafo de chamadas

Antes: uma árvore de chamadas em caixas aninhadas. Depois: a mesma árvore colapsada
numa caixa só, com as chamadas agora internas mostradas esmaecidas dentro dela.

## Estilo

- Editorial, não dashboard corporativo. Whitespace generoso. Serifa opcional nos
  títulos (`font-serif` combina com stone/slate).
- Cor com parcimônia: um acento (emerald ou indigo) + vermelho pra vazamento +
  âmbar pra aviso.
- Diagramas com ~320px de altura, pra antes/depois caberem lado a lado sem scroll.
- `text-xs uppercase tracking-wider` nos labels de module dentro dos diagramas, pra
  lerem como esquema, não como UI.
- Os únicos scripts são o CDN do Tailwind e o import ESM do Mermaid. Fora isso o
  relatório é estático: sem código de app, sem interatividade além do próprio
  Mermaid.

## Seção de recomendação principal

Um card maior. Nome do candidato, uma frase de porquê, âncora pro card dele. Só isso.

## Tom

Português claro e conciso, mas os substantivos e verbos de arquitetura vêm direto do
[GLOSSARIO.md](GLOSSARIO.md). Concisão não é desculpa pra derivar.

**Use exatamente:** module, interface, implementação, depth, deep, shallow, seam,
adapter, leverage, locality.

**Nunca substitua:** componente, serviço, unidade (por module) · API, assinatura,
contrato (por interface) · fronteira, boundary (por seam) · camada, wrapper (por
module, quando quer dizer module).

**Frases que cabem no estilo:**

- "O module de {{DOMAIN_TERM}} é shallow: a interface quase repete a implementação."
- "O estado vaza pelo seam entre a UI e `{{PURE_LOGIC_DIR}}`."
- "Deepen: uma interface, um lugar pra testar."
- "Dois adapters justificam o seam: TMDB em prod, fixture nos testes."

**Bullets de ganho** nomeiam o ganho em termos do glossário: _"locality: os bugs se
concentram num module"_, _"leverage: uma interface, N call sites"_, _"a interface
encolhe; a implementação absorve os wrappers"_. Não escreva _"mais fácil de manter"_
ou _"código mais limpo"_: não estão no glossário e não pagam o espaço.

Sem hedging, sem pigarro, sem "vale notar que…". Se uma frase podia ser um bullet,
faça um bullet. Se um bullet podia ser cortado, corte. Se um termo não está no
[GLOSSARIO.md](GLOSSARIO.md), procure um que esteja antes de inventar um novo.
