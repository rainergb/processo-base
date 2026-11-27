<!-- GERADO por processo-base. Não edite aqui: mude em processo-base/nucleo e rode `npm run sync` lá. -->

# Modelo de handoff

Copie o bloco abaixo para o topo de `{{HANDOFF_PATH}}` ao encerrar uma sessão. Limite de 40
linhas. Se passou disso, o excesso é plano e vai para o {{PREFIX}}-N, ou é decisão e vai para
{{DECISIONS_WHERE}}.

```
# Handoff (AAAA-MM-DD, conta/sessão: ...)

## Estado
- Main em <hash curto>, <limpa | com mudanças não commitadas em: ...>.
- {{CHECK_LABEL}}: <passando | falhando em ...>.

## Em andamento
- {{PREFIX}}-N: <título>, branch <nome>, status <doing | testing>. Falta: <1 linha>.

## Próximo passo exato
<A primeira ação da próxima sessão, em uma frase. Ex: rodar {{BOARD_ONE_CMD}}>

## Não mexer
- <arquivo, branch ou worktree que tem trabalho de outra sessão>

## Decisões novas
- <1 linha, com data. Já registrada em {{DECISIONS_WHERE}}? sim/não>

## Pendências de {{OWNER}}
- <passo manual que só {{OWNER}} faz: SQL, chave, celular>
```

Regras de uso:

1. Escreva ao encerrar, não ao abrir a próxima sessão.
2. Aponte para o {{PREFIX}}-N, não copie o plano.
3. Antes de escrever, confira `git status` e `git worktree list`: o que está lá é a verdade.
4. Sessão nova, de qualquer conta, lê só este arquivo e o {{PREFIX}}-N do item.
