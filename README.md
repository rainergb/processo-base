# processo-base

Processo de trabalho com agentes do Claude Code, empacotado como plugin. Ele gera, em cada
projeto, as regras do processo (líder, especialista e testador, quadro de pendências, handoff,
git e testes), um `CLAUDE.md` curto e duas skills (`/rotina-backlog` e
`/improve-codebase-architecture`). Cada projeto guarda as próprias variáveis em
`docs/processo/config.json` e escreve à mão só o que é dele no `AGENTS.md`.

## Instalar como plugin

Dentro do Claude Code:

```
/plugin marketplace add rainergb/processo-base
/plugin install processo@processo-base
```

Pelo terminal, o equivalente é `claude plugin marketplace add rainergb/processo-base` e
`claude plugin install processo@processo-base`. Para usar uma cópia local (e editar os
templates), passe o caminho da pasta no lugar de `rainergb/processo-base`.

## Usar num projeto

```
/processo:iniciar       # entrevista curta e gera os arquivos do processo no projeto atual
/processo:sincronizar   # regera os arquivos com a versão mais recente dos templates
```

Os scripts só usam módulos do Node, então não é preciso `npm install`.

## O que é gerado

Tudo que está em `nucleo/` vai para o mesmo caminho dentro do projeto:

| Template | Vira |
| --- | --- |
| `nucleo/CLAUDE.md` | `CLAUDE.md` (curto: importa o `AGENTS.md`) |
| `nucleo/docs/processo/AGENTS-NUCLEO.md` | regras do processo, importadas pelo `AGENTS.md` |
| `nucleo/docs/processo/HANDOFF-MODELO.md` | modelo do handoff de até 40 linhas |
| `nucleo/.claude/skills/rotina-backlog/` | skill `/rotina-backlog` (fila do quadro com teto de agentes) |
| `nucleo/.claude/skills/improve-codebase-architecture/` | skill `/improve-codebase-architecture` |
| `nucleo/scripts/front-comments.mjs` | `npm run lint:comments`, só com `NO_UI_COMMENTS` ligado |

No projeto novo, `/processo:iniciar` também cria (sem sobrescrever o que existe) `AGENTS.md`,
`docs/HANDOFF.md`, `docs/PADROES.md`, `docs/DECISOES.md`, `docs/ARQUITETURA.md` e um quadro
local em `docs/backlog.json`, com `npm run backlog` e `npm run backlog:add`.

**Regra de ouro:** arquivo gerado não se edita no projeto. Mudou o processo, mude o template
aqui e sincronize.

## Variáveis e flags

Ficam em `docs/processo/config.json` do projeto. As principais:

| Variável | O que faz | Padrão |
| --- | --- | --- |
| `OWNER` | Quem decide e aprova no projeto | obrigatório |
| `PROJECT_NAME` | Nome do projeto | obrigatório |
| `PREFIX` | Prefixo dos itens do quadro (P para P-12) | obrigatório |
| `WRITING_LANGS` | Regra de idioma de código, comentários e docs | inglês no código, português nos docs |
| `NO_EM_DASH` | Proíbe o travessão em código, docs e commits | `false` |
| `AGENT_CAP` | Máximo de agentes trabalhando ao mesmo tempo | `2` |
| `CHECK_CMD` | Checks que o especialista entrega passando | `npm run check` |
| `PURE_LOGIC_DIR` | Pasta da lógica pura com teste ao lado | `src/lib` |
| `E2E` | Testador roda o e2e | `false` |
| `SEARCH_FIRST` | UI nova procura antes de criar (usa `DESIGN_PLACES`) | `false` |
| `DESIGN_APPROVAL` | Componente novo passa pelo design system (`DESIGN_SYSTEM_WHERE`) | `false` |
| `NO_UI_COMMENTS` | Código de tela sem comentários, com `lint:comments` | `false` |
| `LEADER_MODEL` | O quadro guarda o modelo de cada item | `false` |
| `BOARD_*` | Como ler e gravar o quadro | quadro local em `docs/backlog.json` |

A lista completa e os valores de exemplo estão em `scripts/novo-core.mjs`.

## Vários projetos de uma vez

Quem cuida de vários projetos pode clonar este repositório e listar os caminhos em
`projetos.json` (pessoal, fora do git; parta de `projetos.exemplo.json`):

```
npm run sync                         # todos os projetos do projetos.json
npm run sync -- --only=meu-app       # só um
npm run sync -- --project <caminho>  # um projeto avulso
npm run sync:check                   # só confere; falha se algum divergiu
npm run novo -- --nome meu-app --prefixo M --dono "Seu Nome" [--caminho <pasta>] [--registrar]
npm test
```

`scripts/migrar-config.mjs` converte o formato antigo do `projetos.json` (`{ path, vars }` por
projeto) para o atual, escrevendo um `docs/processo/config.json` em cada projeto.

## Fica fora de propósito

Invariantes de domínio, deploy, tokens de design e o jeito de cada testador subir o app ficam no
`AGENTS.md` de cada projeto.
