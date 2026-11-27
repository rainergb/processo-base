import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { SITUACOES_PADRAO, defaultVars } from "./novo-core.mjs";

function gravar(base, relativo, conteudo) {
  const arquivo = join(base, relativo);
  mkdirSync(dirname(arquivo), { recursive: true });
  writeFileSync(arquivo, typeof conteudo === "string" ? conteudo : `${JSON.stringify(conteudo, null, 2)}\n`, "utf8");
}

function git(dir, ...args) {
  execFileSync("git", ["-C", dir, "-c", "user.name=Exemplo", "-c", "user.email=exemplo@example.com", ...args], { stdio: "ignore" });
}

function repo(base, nome, arquivos, commits) {
  const dir = join(base, nome);
  mkdirSync(dir, { recursive: true });
  git(dir, "init", "-q", "-b", "main");
  for (const [relativo, conteudo] of Object.entries(arquivos)) gravar(dir, relativo, conteudo);
  commits.forEach((assunto, indice) => {
    gravar(dir, `docs/notas-${indice + 1}.md`, `# Nota ${indice + 1}\n`);
    git(dir, "add", "-A");
    git(dir, "commit", "-q", "-m", assunto);
  });
  return dir;
}

export function criarExemplo(base) {
  const repos = join(base, "repos");
  repo(
    repos,
    "loja-api",
    {
      "package.json": { name: "loja-api", version: "1.4.0", scripts: { start: "node dist/main.js", test: "jest" }, dependencies: { "@nestjs/core": "^9.4.0", typeorm: "^0.3.17" }, devDependencies: { typescript: "~5.1.6", jest: "^29.5.0" }, engines: { node: ">=18" } },
      ".nvmrc": "18.19.0\n",
      "src/main.ts": "async function bootstrap() { await app.listen(3000); }\n",
      ".env.example": "PORT=3000\nDATABASE_URL=postgres://usuario:senha-ficticia@db.local:5432/loja\nPAGAMENTOS_URL=http://localhost:4000/v1\nJWT_SECRET=ghp_EXEMPLO_FICTICIO_DE_TOKEN_0123456789abcdef\nAPI_KEY=sk_live_EXEMPLO_FICTICIO_9876543210\n",
    },
    ["feat: cadastro de produtos", "fix: arredonda total do pedido", "feat: endpoint de pedidos"],
  );
  repo(
    repos,
    "loja-web",
    {
      "package.json": { name: "loja-web", version: "0.9.2", scripts: { dev: "next dev -p 3001", build: "next build" }, dependencies: { next: "^14.2.3", react: "^18.3.1" }, devDependencies: { typescript: "^5.4.5", tailwindcss: "^3.4.3" } },
      ".nvmrc": "20.11.1\n",
      ".env.example": "PORT=3001\nNEXT_PUBLIC_API_URL=http://localhost:3000\n",
    },
    ["feat: vitrine de produtos", "feat: carrinho"],
  );
  repo(
    repos,
    "loja-pagamentos",
    {
      "package.json": { name: "loja-pagamentos", version: "2.0.1", scripts: { start: "node server.js" }, dependencies: { express: "^4.19.2" }, engines: { node: "20.x" } },
      ".env.example": "PORT=4000\nGATEWAY_URL=https://gateway.exemplo.test/api\nGATEWAY_TOKEN=tok_EXEMPLO_FICTICIO_abcdef\n",
    },
    ["feat: cobrança por cartão"],
  );

  const projeto = join(base, "projeto");
  const vars = { ...defaultVars({ nome: "loja-demo", prefixo: "L", dono: "Dono Exemplo" }), SITUACOES: SITUACOES_PADRAO, NO_EM_DASH: true };
  vars.REPOS = ["loja-api", "loja-web", "loja-pagamentos"].map((nome) => ({ nome, caminho: `../repos/${nome}` }));
  gravar(projeto, "docs/processo/config.json", { name: "loja-demo", vars });
  gravar(projeto, "docs/SISTEMAS.json", {
    sistemas: {
      "loja-api": { apelido: "API da loja", resumo: "Catálogo, pedidos e autenticação. Fala com o banco e com o serviço de pagamentos.", status: "ativo", leiaPrimeiro: ["`docs/notas-1.md`", "Rodar com `npm start` na porta 3000"] },
      "loja-web": { apelido: "Vitrine", resumo: "Site público de compra, em Next.js.", status: "ativo", leiaPrimeiro: ["`.env.example` para a URL da API"] },
      "loja-pagamentos": { apelido: "Pagamentos", resumo: "Cobrança por cartão via gateway externo.", status: "manutenção" },
    },
  });
  gravar(projeto, "docs/CONEXOES.json", {
    nos: [
      { id: "banco", nome: "Banco da loja", tipo: "banco" },
      { id: "gateway", nome: "Gateway de cartão", tipo: "externo" },
    ],
    conexoes: [
      { de: "loja-web", para: "loja-api", protocolo: "REST", autenticacao: "JWT", descricao: "Catálogo e pedidos" },
      { de: "loja-api", para: "loja-pagamentos", protocolo: "REST", autenticacao: "chave de API", descricao: "Cobrança" },
      { de: "loja-api", para: "banco", protocolo: "SQL", autenticacao: "usuário e senha", descricao: "Dados da loja" },
      { de: "loja-pagamentos", para: "gateway", protocolo: "HTTPS", autenticacao: "token", descricao: "Autoriza o cartão" },
    ],
  });
  gravar(projeto, "docs/HANDOFF.md", [
    "# Handoff (2026-11-27, conta/sessão: exemplo)",
    "",
    "## Estado",
    "- Main limpa. Checks passando.",
    "",
    "## Em andamento",
    "- L-2: Total do pedido arredondado errado, situação desenvolvimento.",
    "",
    "## Próximo passo exato",
    "Rodar `npm run backlog -- L-2` e fechar o teste de regressão do arredondamento.",
    "",
    "## Pendências de Dono Exemplo",
    "- Aprovar a proposta do L-3 (opção A ou B).",
    "- Rodar o SQL de índice do L-4 no banco de homologação.",
    "",
  ].join("\n"));
  gravar(projeto, "docs/DECISOES.md", [
    "# Decisões",
    "",
    "- 2026-11-20: o carrinho fica no navegador até o login (menos estado no servidor).",
    "- 2026-11-24: pagamentos só por cartão na primeira versão.",
    "- 2026-11-26: o total do pedido usa centavos inteiros em todo lugar.",
    "",
  ].join("\n"));
  gravar(projeto, "docs/backlog.json", {
    prefix: "L",
    items: [
      { ref: 1, title: "Cadastro de produtos com foto", summary: "Lojista cadastra produto e vê na vitrine.", area: "api", kind: "task", priority: "media", status: "finalizado", createdAt: "2026-11-10T10:00:00.000Z", updatedAt: "2026-11-21T16:00:00.000Z",
        description: "**Problema**\nHoje o cadastro é feito direto no banco.\n\n**Pronto quando**\n- [x] Abrir o painel do lojista, tocar em Novo produto e salvar com foto\n- [x] Abrir a vitrine e ver o produto novo\n\n**Decisões**\n- Foto até 2 MB.",
        prs: ["PR da API: cadastro de produtos (mergeado)", "PR da vitrine: exibe foto"], veredito: { resultado: "APROVADO", por: "testador", data: "2026-11-19", resumo: "Todos os critérios passaram em desktop e em 375 px." }, linhaDoTempo: [{ data: "2026-11-12T12:00:00.000Z", texto: "Proposta aprovada (opção A)" }, { data: "2026-11-20T09:00:00.000Z", texto: "Verificado em produção, só leitura" }] },
      { ref: 2, title: "Total do pedido arredondado errado", summary: "Pedidos com 3 itens somam 1 centavo a menos.", area: "api", kind: "bug", priority: "alta", status: "desenvolvimento", createdAt: "2026-11-24T09:00:00.000Z", updatedAt: "2026-11-27T08:30:00.000Z",
        description: "**Problema**\nO total soma preços em decimal e perde centavos em alguns casos.\n\n**Arquivos**\n`src/pedidos/total.ts`\n\n**Pronto quando**\n- [x] Pedido de 3 itens de R$ 0,10 mostra total de R$ 0,30\n- [~] Carrinho e pedido mostram o mesmo total\n- [ ] Pedido com cupom mostra o desconto certo\n\n**Decisões**\n- Centavos inteiros em todo lugar (2026-11-26, Dono Exemplo).",
        decisoes: [{ texto: "Usar centavos inteiros em todo lugar", quem: "Dono Exemplo", data: "2026-11-26" }],
        prs: ["PR da API: total em centavos (em revisão)"],
        achadosExtras: [{ titulo: "Frete calculado sem arredondar", ref: "L-5", problema: "O frete tem o mesmo problema de decimal." }],
        textoSugerido: [{ rotulo: "Mensagem de commit", texto: "fix: arredonda total do pedido em centavos (L-2)" }, { rotulo: "Descrição do PR", texto: "Troca a soma decimal por centavos inteiros.\n\nTeste de regressão: it(\"L-2: soma 3 itens de 10 centavos\")." }],
        linhaDoTempo: [{ data: "2026-11-25T14:00:00.000Z", texto: "Proposta aprovada (opção B, centavos inteiros)" }] },
      { ref: 3, title: "Cupom de desconto no carrinho", summary: "Cliente aplica cupom e vê o novo total.", area: "web", kind: "feature", priority: "media", status: "proposta", createdAt: "2026-11-26T11:00:00.000Z", updatedAt: "2026-11-26T11:00:00.000Z",
        description: "**Problema**\nNão existe campo de cupom.\n\n**Pronto quando**\n- [ ] No carrinho, digitar CUPOM10 e ver 10% de desconto\n- [ ] Cupom inválido mostra mensagem clara" },
      { ref: 4, title: "Índice na busca de produtos", area: "api", kind: "task", priority: "baixa", status: "teste", createdAt: "2026-11-18T09:00:00.000Z", updatedAt: "2026-11-26T18:00:00.000Z",
        description: "**Problema**\nBusca por nome demora com muitos produtos.\n\n**Pronto quando**\n- [x] Buscar \"camiseta\" responde em menos de 1 segundo\n- [ ] Resultado traz os mesmos produtos de antes",
        veredito: { resultado: "RECUSADO", por: "testador", data: "2026-11-26", resumo: "A busca ficou rápida, mas a ordem dos resultados mudou.", passos: "1. Abrir a vitrine\n2. Buscar \"camiseta\"\n3. Esperado: mais vendidos primeiro. Obtido: ordem alfabética." } },
      { ref: 5, title: "Frete calculado sem arredondar", area: "api", kind: "bug", priority: "media", status: "proposta", createdAt: "2026-11-27T08:40:00.000Z", updatedAt: "2026-11-27T08:40:00.000Z", description: "**Problema**\nAchado extra do L-2: o frete soma decimais.\n\n**Pronto quando**\n- [ ] Frete de R$ 12,30 aparece com duas casas" },
    ],
  });
  return { projeto, repos };
}
