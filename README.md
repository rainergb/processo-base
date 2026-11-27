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

## Novidades da 0.2

- **Agentes como arquivos** em `.claude/agents/`: `analista-proposta` (Opus, só lê), `especialista` (Sonnet,
  implementa só o aprovado) e `testador` (Sonnet, só com ferramentas do navegador embutido, sem arquivo nem
  terminal). Modelos de brief e de relatório em `docs/processo/BRIEF-MODELO.md` e
  `docs/processo/RELATORIO-TESTE-MODELO.md`.
- **Núcleo com mais regras:** proposta aprovada antes do código (critérios de pronto são o contrato), correção
  mínima com "Achados extras", segurança (produção só leitura, credencial nunca em texto, nunca ler `.env`),
  situações configuráveis e verificação pós-deploy.
- **Flags novas**, todas com padrão que mantém o comportamento da 0.1 (config antigo continua valendo):

| Variável | Valores | Padrão |
| --- | --- | --- |
| `MERGE_POLICY` | `lider` (líder mergeia com checks passando) ou `dono` (merge e push só com OK do dono) | `lider` |
| `PUSH_POLICY` | `lote` ou `dono` | `lote` |
| `COMMIT_STYLE` | `prefixo` (`P-12 feat(x): ...`) ou `conventional` (`fix: ... (P-12)`) | `prefixo` |
| `TESTER_SCOPE` | `alta` (só prioridade alta) ou `todas` | `alta` |
| `REPOS` | lista `{ "nome", "caminho" }` para projeto com vários repositórios; vazio é o repositório atual | `[]` |
| `SITUACOES` | lista `{ id, nome, aberta, papel }`. Projeto novo: Proposta, Em desenvolvimento, Em revisão, Em teste, Testado, Commitado, Mergeado, Finalizado. Config sem a chave: as situações da 0.1 (`todo`, `doing`...) | ver acima |
| `PAINEL`, `PAINEL_PORT` | gera os scripts do painel; porta | `true` em projeto novo, `3340` |

No `novo`: `--merge`, `--push`, `--commit`, `--testador`, `--repos "api=../api,web=../web"`, `--sem-painel`.
Projeto que já usa o plugin: rode `/processo:sincronizar`; os arquivos novos aparecem e nada do que existia
muda. Para ligar o painel num projeto antigo, ponha `"PAINEL": true` no config e adicione ao `package.json`
`"mapa": "node scripts/painel/mapa.mjs"`, `"painel": "node scripts/painel/painel.mjs"` e
`"conexoes": "node scripts/painel/conexoes.mjs"`.

## Painel (sem dependências)

```
npm run mapa      # coleta cada repositório do config e grava docs/painel/mapa.json
npm run painel    # sobe em http://localhost:3340 (porta: --porta, PORT ou PAINEL_PORT), também na rede
npm run conexoes  # grava docs/painel/conexoes.svg
```

- **Mapa:** stack e versões (`package.json`), Node (`.nvmrc`, `.node-version`, `engines`), porta (só de
  `.env.example`, `environment*.ts` e `main.ts`), arquivos, commits, último commit e branch padrão. **Nunca lê
  `.env`.** Do que acha, guarda só host e porta: valor de chave, senha ou token nunca vai para o `mapa.json`.
- **Páginas:** `/` dashboard (números, quadro por situação, próximo passo e pendências do dono lidos do HANDOFF,
  decisões recentes), `/sistemas` e `/sistemas/<repo>`, `/sistemas/conexoes` (diagrama SVG), `/quadro` e
  `/quadro/<n>` (página do item). Tema claro e escuro, funciona em 375 px. Sem Jira nem GitHub ao vivo.
- **Arquivos que você escreve:**
  - `docs/SISTEMAS.json`: `{ "sistemas": { "<repo>": { "apelido", "resumo", "status", "leiaPrimeiro": [] } } }`
  - `docs/CONEXOES.json`: `{ "nos": [{ "id", "nome", "tipo" }], "conexoes": [{ "de", "para", "protocolo", "autenticacao", "descricao" }] }`.
    O mapa sugere ligações (linha tracejada) a partir de URLs e portas achadas.
  - `docs/backlog.json`: o formato do item continua valendo. Campos opcionais novos: `criterios`
    (`[{ texto, estado: feito|parcial|pendente }]`; sem ele, vem do checklist do "Pronto quando"), `decisoes`
    (`[{ texto, quem, data }]`), `prs` (lista de textos), `prints` (`[{ arquivo, legenda }]`, arquivo relativo a
    `docs/` ou URL), `veredito` (`{ resultado, por, data, resumo, passos }`), `linhaDoTempo` (`[{ data, texto }]`),
    `achadosExtras` (`[{ titulo, ref, problema }]`) e `textoSugerido` (`[{ rotulo, texto }]`, com botão copiar).
- **Ver sem projeto:** `node scripts/exemplo-painel.mjs` cria um projeto fictício em `exemplos/painel-demo`.

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
| `nucleo/.claude/agents/` | agentes `analista-proposta`, `especialista` e `testador` |
| `nucleo/docs/processo/BRIEF-MODELO.md`, `RELATORIO-TESTE-MODELO.md` | modelos de brief e de relatório do testador |
| `nucleo/scripts/painel/` | `npm run mapa` e `npm run painel`, só com `PAINEL` ligado |
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
