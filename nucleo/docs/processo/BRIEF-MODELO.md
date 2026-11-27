<!-- GERADO por processo-base. Não edite aqui: mude em processo-base/nucleo e rode `npm run sync` lá. -->

# Modelo de brief (líder)

Copie, preencha e mande ao agente. **O brief é tudo o que o agente sabe.**

## Para o analista de proposta
- **Item:** {{PREFIX}}-N, título.
- **Pedido:** o que {{OWNER}} quer, nas palavras dele.
- **Onde olhar:** repositórios e pastas prováveis.
- **Devolver:** proposta no formato do agente `analista-proposta` (causa, arquivos, opções, correção mínima,
  achados extras, estimativa, critérios de pronto).
- **Limites:** só leitura.

## Para o especialista
- **Item:** {{PREFIX}}-N, título.
- **Proposta aprovada:** link ou trecho no item, com a opção escolhida por {{OWNER}} e a data.
- **Onde:** repositório, worktree e branch `feat/{{PREFIX_LOWER}}-N-...` a partir da main atualizada.
- **Correção mínima:** o que entra no diff. Fora do diff: ...
- **Como subir local:** comando, porta, dados fictícios.
- **Pronto quando:** {{CHECK_CMD}} passando, teste de regressão `it("{{PREFIX}}-N: ...")`, app no ar com URL,
  relatório devolvido.
- **Limites:** sem push, sem PR, sem merge, sem produção.

## Para o testador (cego)
Nada de arquivo, diff, branch ou nome de função. Só:
- **O que mudou, em palavras de usuário:** ...
- **Onde testar:** URL local, usuário fictício.
- **Critérios de pronto:** copiados da proposta ("abrir X, tocar em Y, ver Z").
- **Não testar:** ...

## Voltas
Recusa do testador volta para a mesma sessão do especialista, com o relatório. Depois de 2 recusas no mesmo
item, o líder revê a especificação antes de levar a {{OWNER}}.
