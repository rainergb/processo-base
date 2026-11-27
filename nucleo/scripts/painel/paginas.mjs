import { dataCurta, esc, inline } from "./html.mjs";
import { gerarSvg, montarGrafo } from "./conexoes-core.mjs";
import { pagina } from "./ui.mjs";

function tomDaSituacao(situacao) {
  if (situacao.papel === "andamento") return "info";
  if (situacao.papel === "teste") return "warn";
  if (situacao.papel === "feito") return "ok";
  if (!situacao.aberta && !/^(dropped|descartado)$/.test(situacao.id)) return "ok";
  if (!situacao.aberta || situacao.papel === "fila") return "";
  return "accent";
}

const TOM_PRIORIDADE = { alta: "danger", media: "warn", baixa: "" };
const ROTULO_PRIORIDADE = { alta: "alta", media: "média", baixa: "baixa" };

function badge(texto, tom = "") {
  return `<span class="badge${tom ? ` ${tom}` : ""}">${esc(texto)}</span>`;
}

function situacaoDe(quadro, id) {
  return quadro.situacoes.find((s) => s.id === id) ?? { id, nome: id, aberta: true, papel: "" };
}

function selo(quadro, item) {
  const situacao = situacaoDe(quadro, item.status);
  return badge(situacao.nome, tomDaSituacao(situacao));
}

function lista(itens, vazio) {
  if (!itens.length) return `<p class="vazio">${esc(vazio)}</p>`;
  return `<ul class="lista">${itens.map((texto) => `<li>${inline(texto)}</li>`).join("")}</ul>`;
}

function numeros(rotulo, valor) {
  return `<div class="card"><div class="num">${esc(valor)}</div><div class="rot">${esc(rotulo)}</div></div>`;
}

function barra(resumo) {
  if (!resumo.total) return "";
  const feito = (resumo.feito / resumo.total) * 100;
  const parcial = (resumo.parcial / resumo.total) * 100;
  return `<div class="barra" title="${resumo.feito} feitos, ${resumo.parcial} parciais, ${resumo.pendente} pendentes"><i class="f" style="width:${feito}%"></i><i class="p" style="width:${parcial}%"></i></div>`;
}

function aviso(texto) {
  return `<div class="aviso">${texto}</div>`;
}

function dadosDoSistema(ctx, repo) {
  return ctx.sistemasManual[repo.nome] ?? {};
}

function chavePorta(repo) {
  return repo.porta?.porta ? String(repo.porta.porta) : "sem porta";
}

export function dashboard(ctx) {
  const { mapa, quadro, handoff, decisoes, config } = ctx;
  const repos = mapa?.repos ?? [];
  const arquivos = repos.reduce((soma, repo) => soma + (repo.arquivos ?? 0), 0);
  const commits = repos.reduce((soma, repo) => soma + (repo.commits ?? 0), 0);
  const abertos = quadro.situacoes.filter((s) => s.aberta).reduce((soma, s) => soma + s.itens.length, 0);
  const corpo = [];
  corpo.push(`<h1>${esc(config.nome)}</h1><p class="sub">${config.dono ? `Dono: ${esc(config.dono)}. ` : ""}Visão geral do projeto, lida dos arquivos do repositório.</p>`);
  if (!mapa) corpo.push(aviso("O mapa ainda não foi gerado. Rode <code>npm run mapa</code> para coletar os repositórios."));
  corpo.push(`<div class="grade g4">${numeros("repositórios", repos.length)}${numeros("arquivos", arquivos.toLocaleString("pt-BR"))}${numeros("commits", commits.toLocaleString("pt-BR"))}${numeros("itens abertos", abertos)}</div>`);

  const colunas = quadro.situacoes
    .filter((situacao) => situacao.itens.length)
    .map((situacao) => {
      const itens = situacao.itens
        .slice(0, 4)
        .map((item) => `<li><a href="/quadro/${item.ref}"><b>${esc(item.codigo)}</b> ${esc(item.title)}</a></li>`)
        .join("");
      const resto = situacao.itens.length > 4 ? `<li class="rot">e mais ${situacao.itens.length - 4}</li>` : "";
      return `<div class="card"><div class="linha"><h3>${badge(situacao.nome, tomDaSituacao(situacao))}</h3><span class="esp"></span><b>${situacao.itens.length}</b></div><ul class="lista">${itens}${resto}</ul></div>`;
    });
  corpo.push(`<h2>Quadro por situação</h2>`);
  corpo.push(colunas.length ? `<div class="grade g3">${colunas.join("")}</div><p style="margin-top:12px"><a href="/quadro">Abrir o quadro completo</a></p>` : `<p class="vazio">Quadro vazio. Crie o primeiro item com <code>npm run backlog:add</code>.</p>`);

  corpo.push(`<div class="grade g2" style="margin-top:8px"><div><h2>Próximo passo</h2><div class="card">${handoff.existe ? (handoff.proximoPasso ? inline(handoff.proximoPasso).replace(/\n/g, "<br>") : '<span class="vazio">Handoff sem próximo passo.</span>') : '<span class="vazio">Sem HANDOFF.md ainda.</span>'}</div></div>`);
  corpo.push(`<div><h2>Pendências${config.dono ? ` de ${esc(config.dono)}` : " do dono"}</h2><div class="card">${lista(handoff.pendencias, "Nenhuma pendência registrada.")}</div></div></div>`);
  corpo.push(`<h2>Decisões recentes</h2><div class="card">${lista(decisoes, "Nenhuma decisão registrada em docs/DECISOES.md.")}</div>`);
  return pagina({ titulo: "Dashboard", ativo: "/", ctx, corpo: corpo.join("\n") });
}

export function sistemas(ctx) {
  const repos = ctx.mapa?.repos ?? [];
  const cartoes = repos.map((repo) => {
    const manual = dadosDoSistema(ctx, repo);
    const stack = (repo.stack ?? []).slice(0, 5).map((s) => badge(`${s.nome} ${s.versao}`.trim(), "accent")).join("");
    const titulo = manual.apelido ? `${esc(manual.apelido)} <span class="rot">${esc(repo.nome)}</span>` : esc(repo.nome);
    return `<a class="card" href="/sistemas/${encodeURIComponent(repo.nome)}"><div class="linha"><h3>${titulo}</h3><span class="esp"></span>${manual.status ? badge(manual.status, "info") : ""}</div><p>${esc(manual.resumo ?? "Sem resumo. Preencha em docs/SISTEMAS.json.")}</p><div class="chips">${stack}</div><p class="rot" style="margin:10px 0 0">${repo.existe ? `${repo.commits ?? 0} commits, ${repo.arquivos ?? 0} arquivos, porta ${esc(chavePorta(repo))}` : "pasta não encontrada"}</p></a>`;
  });
  const corpo = [`<h1>Sistemas</h1><p class="sub">Um cartão por repositório do projeto. Os números vêm do mapa; apelido, resumo e status vêm de <code>docs/SISTEMAS.json</code>.</p>`];
  if (!ctx.mapa) corpo.push(aviso("O mapa ainda não foi gerado. Rode <code>npm run mapa</code>."));
  corpo.push(cartoes.length ? `<div class="grade g3">${cartoes.join("")}</div>` : `<p class="vazio">Nenhum repositório mapeado.</p>`);
  corpo.push(`<p style="margin-top:16px"><a href="/sistemas/conexoes">Ver como os sistemas se conectam</a></p>`);
  return pagina({ titulo: "Sistemas", ativo: "/sistemas", ctx, corpo: corpo.join("\n") });
}

function fato(rotulo, valor) {
  return `<tr><th scope="row">${esc(rotulo)}</th><td>${valor}</td></tr>`;
}

export function sistema(ctx, nome) {
  const repo = (ctx.mapa?.repos ?? []).find((r) => r.nome === nome);
  if (!repo) return null;
  const manual = dadosDoSistema(ctx, repo);
  const ultimo = repo.ultimoCommit;
  const ligacoes = [...ctx.conexoes.conexoes, ...(ctx.mapa?.conexoesSugeridas ?? [])].filter((c) => c.de === nome || c.para === nome);
  const fatos = [
    fato("Caminho", `<code>${esc(repo.caminho)}</code>`),
    fato("Stack", (repo.stack ?? []).map((s) => badge(`${s.nome} ${s.versao}`.trim(), "accent")).join(" ") || '<span class="vazio">não detectada</span>'),
    fato("Node", repo.node ? `${esc(repo.node.versao)} <span class="rot">(${esc(repo.node.origem)})</span>` : '<span class="vazio">não declarado</span>'),
    fato("Porta", repo.porta ? `${repo.porta.porta} <span class="rot">(${esc(repo.porta.origem)})</span>` : '<span class="vazio">não encontrada</span>'),
    fato("Arquivos", esc(repo.arquivos ?? 0)),
    fato("Commits", esc(repo.commits ?? 0)),
    fato("Último commit", ultimo ? `<code>${esc(ultimo.hash)}</code> ${esc(ultimo.assunto)} <span class="rot">${esc(dataCurta(ultimo.data))}</span>` : '<span class="vazio">sem commits</span>'),
    fato("Branch padrão", repo.branchPadrao ? `<code>${esc(repo.branchPadrao)}</code>` : '<span class="vazio">desconhecida</span>'),
  ].join("");
  const enderecos = (repo.enderecos ?? []).length
    ? `<div class="rolagem"><table><thead><tr><th>Protocolo</th><th>Host</th><th>Porta</th><th>Achado em</th></tr></thead><tbody>${repo.enderecos.map((e) => `<tr><td>${esc(e.protocolo)}</td><td><code>${esc(e.host)}</code></td><td>${esc(e.porta ?? "")}</td><td>${esc(e.origem)}</td></tr>`).join("")}</tbody></table></div>`
    : '<p class="vazio">Nenhum endereço achado em .env.example ou environment.</p>';
  const leia = (manual.leiaPrimeiro ?? []).length ? `<ul class="lista">${manual.leiaPrimeiro.map((l) => `<li>${inline(l)}</li>`).join("")}</ul>` : '<p class="vazio">Nada indicado. Preencha "leiaPrimeiro" em docs/SISTEMAS.json.</p>';
  const ligs = ligacoes.length
    ? `<ul class="lista">${ligacoes.map((c) => `<li><b>${esc(c.de)}</b> chama <b>${esc(c.para)}</b> ${c.protocolo ? badge(c.protocolo) : ""}${c.sugerida ? badge("sugerida pelo mapa", "warn") : ""}</li>`).join("")}</ul>`
    : '<p class="vazio">Nenhuma ligação conhecida.</p>';
  const scripts = repo.pacote?.scripts?.length ? `<div class="chips">${repo.pacote.scripts.map((s) => `<code>${esc(s)}</code>`).join("")}</div>` : '<p class="vazio">Sem scripts npm.</p>';
  const corpo = `<p class="migalha"><a href="/sistemas">Sistemas</a> / ${esc(nome)}</p>
<div class="linha"><h1>${esc(manual.apelido || nome)}</h1><span class="esp"></span>${manual.status ? badge(manual.status, "info") : ""}</div>
<p class="sub">${esc(manual.resumo ?? "Sem resumo. Preencha em docs/SISTEMAS.json.")}</p>
<div class="grade g2"><div class="card rolagem"><table><tbody>${fatos}</tbody></table></div><div class="card"><h3>Leia primeiro</h3>${leia}<h3 style="margin-top:16px">Conexões</h3>${ligs}</div></div>
<h2>Endereços achados</h2><div class="card">${enderecos}</div>
<h2>Scripts</h2><div class="card">${scripts}</div>`;
  return pagina({ titulo: nome, ativo: "/sistemas", ctx, corpo });
}

export function conexoes(ctx) {
  const grafo = montarGrafo({ ...ctx.conexoes, sugeridas: ctx.mapa?.conexoesSugeridas ?? [], repos: ctx.mapa?.repos ?? [] });
  const svg = gerarSvg(grafo);
  const linhas = grafo.arestas.map((c) => `<tr><td>${esc(c.de)}</td><td>${esc(c.para)}</td><td>${esc(c.protocolo ?? "")}</td><td>${esc(c.autenticacao ?? "")}</td><td>${c.sugerida ? badge("sugerida", "warn") + " " + esc(c.origem ?? "") : esc(c.descricao ?? "")}</td></tr>`).join("");
  const corpo = `<p class="migalha"><a href="/sistemas">Sistemas</a> / Conexões</p><h1>Conexões</h1>
<p class="sub">Quem chama quem. As setas cheias vêm de <code>docs/CONEXOES.json</code>; as tracejadas são sugeridas pelo mapa a partir de URLs e portas achadas.</p>
${svg ? `<div class="diagrama">${svg}</div>` : '<p class="vazio">Nada a desenhar. Preencha docs/CONEXOES.json ou rode <code>npm run mapa</code>.</p>'}
<h2>Lista de ligações</h2>
<div class="card rolagem">${linhas ? `<table><thead><tr><th>De</th><th>Para</th><th>Protocolo</th><th>Autenticação</th><th>Observação</th></tr></thead><tbody>${linhas}</tbody></table>` : '<p class="vazio">Nenhuma ligação.</p>'}</div>`;
  return pagina({ titulo: "Conexões", ativo: "/sistemas/conexoes", ctx, corpo });
}

function linhaDoItem(quadro, item) {
  return `<li><div class="linha"><a href="/quadro/${item.ref}"><b>${esc(item.codigo)}</b> ${esc(item.title)}</a><span class="esp"></span>${item.area ? `<span class="rot">${esc(item.area)}</span>` : ""}${badge(ROTULO_PRIORIDADE[item.priority] ?? item.priority, TOM_PRIORIDADE[item.priority] ?? "")}</div>${item.resumo.total ? `<div style="margin-top:6px">${barra(item.resumo)}</div>` : ""}</li>`;
}

export function quadro(ctx) {
  const q = ctx.quadro;
  const abertas = q.situacoes.filter((s) => s.aberta);
  const fechadas = q.situacoes.filter((s) => !s.aberta && s.itens.length);
  const bloco = (s) => `<section id="${esc(s.id)}"><div class="linha"><h2>${esc(s.nome)}</h2>${badge(String(s.itens.length), tomDaSituacao(s))}</div><div class="card">${s.itens.length ? `<ul class="lista">${s.itens.map((i) => linhaDoItem(q, i)).join("")}</ul>` : '<span class="vazio">Nenhum item.</span>'}</div></section>`;
  const corpo = `<h1>Quadro ${esc(q.prefixo)}-N</h1><p class="sub">Lido de <code>docs/backlog.json</code>. Cada item abre numa página com o contrato, as decisões e a linha do tempo.</p>
<div class="chips">${q.situacoes.map((s) => `<a href="#${esc(s.id)}">${badge(`${s.nome} ${s.itens.length}`, tomDaSituacao(s))}</a>`).join("")}</div>
${q.itens.length ? abertas.map(bloco).join("") : '<p class="vazio">Quadro vazio. Crie o primeiro item com <code>npm run backlog:add</code>.</p>'}
${fechadas.length ? `<details><summary>Itens fechados (${fechadas.reduce((n, s) => n + s.itens.length, 0)})</summary>${fechadas.map(bloco).join("")}</details>` : ""}`;
  return pagina({ titulo: "Quadro", ativo: "/quadro", ctx, corpo });
}

function secaoItem(titulo, conteudo) {
  return `<section><h2>${esc(titulo)}</h2><div class="card">${conteudo}</div></section>`;
}

function origemDoPrint(print) {
  const arquivo = print.arquivo ?? print.src ?? "";
  if (/^https?:\/\//i.test(arquivo)) return arquivo;
  return `/arquivos/${arquivo.split("/").map(encodeURIComponent).join("/")}`;
}

function textoPadrao(item) {
  return `${item.codigo}: ${item.title}\n\nProblema: ${item.problema || "(sem descrição)"}\n\nPronto quando:\n${item.criterios.map((c) => `- ${c.texto}`).join("\n") || "- (sem critérios)"}`;
}

export function itemDoQuadro(ctx, ref) {
  const item = ctx.quadro.itens.find((i) => String(i.ref) === String(ref));
  if (!item) return null;
  const q = ctx.quadro;
  const marca = { feito: "✓", parcial: "~", pendente: "" };
  const criterios = item.criterios.length
    ? `<ul class="crit">${item.criterios.map((c) => `<li><span class="marca-est ${c.estado}">${marca[c.estado]}</span><span>${inline(c.texto)}<br><span class="rot">${c.estado}</span></span></li>`).join("")}</ul>${barra(item.resumo)}`
    : '<p class="vazio">Nenhum critério. Escreva o "Pronto quando" como checklist na descrição.</p>';
  const decisoes = item.decisoes.length
    ? `<ul class="lista">${item.decisoes.map((d) => `<li>${inline(d.texto ?? "")}${d.quem ? ` <span class="rot">${esc(d.quem)}</span>` : ""}${d.data ? ` <span class="rot">${esc(dataCurta(d.data))}</span>` : ""}</li>`).join("")}</ul>`
    : item.decisoesTexto
      ? `<p>${inline(item.decisoesTexto).replace(/\n/g, "<br>")}</p>`
      : '<p class="vazio">Nenhuma decisão registrada.</p>';
  const prs = item.prs.length ? `<ul class="lista">${item.prs.map((p) => `<li>${inline(p)}</li>`).join("")}</ul>` : '<p class="vazio">Nenhum PR registrado.</p>';
  const prints = item.prints.length
    ? item.prints.map((p) => `<figure style="margin:0 0 12px"><img class="print" src="${esc(origemDoPrint(p))}" alt="${esc(p.legenda ?? "print")}" loading="lazy"><figcaption class="rot">${esc(p.legenda ?? "")}</figcaption></figure>`).join("")
    : '<p class="vazio">Sem prints.</p>';
  const v = item.veredito;
  const resultado = v ? String(v.resultado ?? "").toUpperCase() : "";
  const veredito = v
    ? `<div class="veredito ${resultado === "APROVADO" ? "aprovado" : resultado === "RECUSADO" ? "recusado" : ""}"><div class="linha"><b>${esc(resultado || "SEM RESULTADO")}</b><span class="esp"></span><span class="rot">${esc(v.por ?? "testador")} ${esc(dataCurta(v.data))}</span></div>${v.resumo ? `<p>${inline(v.resumo)}</p>` : ""}${v.passos ? `<p class="rot">Passos para reproduzir</p><p>${inline(v.passos).replace(/\n/g, "<br>")}</p>` : ""}</div>`
    : '<p class="vazio">Ainda sem veredito do testador.</p>';
  const tempo = `<ul class="tempo">${item.linhaDoTempo.map((e) => `<li><span class="rot">${esc(dataCurta(e.data))}</span><br>${inline(e.texto)}</li>`).join("")}</ul>`;
  const extras = item.achadosExtras.length
    ? `<ul class="lista">${item.achadosExtras.map((a) => `<li><b>${esc(a.titulo ?? "")}</b>${a.ref ? ` ${badge(String(a.ref))}` : ""}${a.problema ? `<br>${inline(a.problema)}` : ""}</li>`).join("")}</ul>`
    : item.achadosExtrasTexto
      ? `<p>${inline(item.achadosExtrasTexto).replace(/\n/g, "<br>")}</p>`
      : '<p class="vazio">Nenhum achado extra.</p>';
  const sugeridos = (item.textoSugerido.length ? item.textoSugerido : [{ rotulo: "Resumo do item", texto: textoPadrao(item) }])
    .map((s, i) => `<div class="cartao-sugerido"><div class="linha"><b>${esc(s.rotulo ?? "Texto sugerido")}</b><span class="esp"></span><button class="btn" type="button" data-copiar="sug-${i}">Copiar</button></div><pre id="sug-${i}">${esc(s.texto ?? "")}</pre></div>`)
    .join("");
  const corpo = `<p class="migalha"><a href="/quadro">Quadro</a> / ${esc(item.codigo)}</p>
<div class="linha"><h1>${esc(item.codigo)} ${esc(item.title)}</h1></div>
<div class="chips">${selo(q, item)}${badge(`prioridade ${ROTULO_PRIORIDADE[item.priority] ?? item.priority}`, TOM_PRIORIDADE[item.priority] ?? "")}${item.area ? badge(item.area) : ""}</div>
${item.summary ? `<p class="sub" style="margin-top:10px">${inline(item.summary)}</p>` : ""}
${secaoItem("Problema", item.problema ? `<p>${inline(item.problema).replace(/\n/g, "<br>")}</p>` : '<p class="vazio">Sem descrição.</p>')}
${secaoItem("Pronto quando", criterios)}
${secaoItem("Decisões", decisoes)}
${secaoItem("PRs", prs)}
${secaoItem("Veredito do testador", veredito)}
${secaoItem("Prints", prints)}
${secaoItem("Linha do tempo", tempo)}
${secaoItem("Achados extras", extras)}
${secaoItem("Texto sugerido", sugeridos)}`;
  return pagina({ titulo: item.codigo, ativo: "/quadro", ctx, corpo });
}

export function naoEncontrada(ctx) {
  return pagina({ titulo: "Não encontrada", ativo: "", ctx, corpo: `<h1>Página não encontrada</h1><p><a href="/">Voltar ao dashboard</a></p>` });
}
