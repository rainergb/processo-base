<!-- GERADO por processo-base. Não edite aqui: mude em processo-base/nucleo e rode `npm run sync` lá. -->

# Vocabulário de arquitetura

Este arquivo substitui a skill `codebase-design` (que não existe neste projeto).
Use estes termos **exatamente**, em qualquer sugestão ou diagrama.

## Termos

- **module**: uma unidade com interface e implementação. Neste projeto:
  {{MODULE_EXAMPLES}}
- **interface**: o que um module expõe: assinaturas exportadas, props, o formato do
  que entra e do que sai. É a superfície que os call sites enxergam.
- **implementation**: o que o module esconde atrás da interface.
- **depth / deep / shallow**: a razão entre implementação e interface. **Deep**:
  interface pequena escondendo muita implementação. **Shallow**: interface quase tão
  grande quanto a implementação (o module quase não esconde nada).
- **seam**: o ponto onde dá pra trocar a implementação sem tocar nos call sites.
- **adapter**: uma implementação concreta atrás de um seam. Um adapter = seam
  hipotético; dois adapters = seam real.
- **leverage**: uma mudança na interface que se paga em N call sites.
- **locality**: o quanto entender/consertar um comportamento cabe num lugar só.

## Princípios

- **Deletion test**: apagar este module concentraria complexidade ou só a moveria?
  "Concentra" é o sinal que interessa; "só move" significa que o module era shallow
  e o refactor não vale.
- **A interface é a superfície de teste**: se testar exige furar a interface
  (importar interno, mockar detalhe), a interface está errada, não o teste.
- **Um adapter = seam hipotético, dois = seam real**: não crie seam pra um caso só.

## Nunca substituir

- `component`, `service`, `unit` → use **module**
- `API`, `signature`, `contrato` → use **interface**
- `boundary`, `fronteira`, `camada` → use **seam**
- `layer`, `wrapper` (quando quer dizer module) → use **module**

## Frases que cabem no estilo

- "O module de {{DOMAIN_TERM}} é shallow: a interface quase repete a implementação."
- "O estado vaza pelo seam entre a UI e `{{PURE_LOGIC_DIR}}`."
- "Deepen: uma interface, um lugar pra testar."
- "Dois adapters justificam o seam: TMDB em prod, fixture nos testes."
