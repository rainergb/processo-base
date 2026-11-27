# {{NOME}}: regras para agentes

Leia só o que a tarefa pede, para não gastar contexto à toa:

1. [docs/HANDOFF.md](docs/HANDOFF.md) e o {{PREFIX}}-N do item: sempre, em sessão nova.
2. [docs/PADROES.md](docs/PADROES.md): se mexer em UI ou convenção.
3. [docs/DECISOES.md](docs/DECISOES.md): se a tarefa tocar numa decisão.

O processo (escrita, modelos, líder/especialista/testador, fluxo, handoff, quadro {{PREFIX}}-N, git e
testes) é o núcleo compartilhado gerado pelo processo-base, junto com o
`CLAUDE.md` e as skills de `.claude/skills/`. Não edite arquivo gerado: mudou o processo, mude no
repositório do processo-base e rode `npm run sync` lá (ou `/processo:sincronizar` se usar o plugin).

@docs/processo/AGENTS-NUCLEO.md

# Só do {{NOME}}

- Stack, comandos de ambiente e invariantes do projeto entram aqui.
