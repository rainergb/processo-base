import { esc } from "./html.mjs";

const CLARO = `--bg:#f6f7f9;--bg-elev:#fff;--bg-sunken:#eef0f3;--border:#e3e6eb;--border-strong:#cfd4dc;--text:#14171c;--text-2:#4a5260;--text-3:#7a8392;--accent:#2f5bea;--accent-soft:#e8eeff;--ok:#138a52;--ok-soft:#e3f5ec;--info:#0b7a99;--info-soft:#e1f3f8;--warn:#a8620a;--warn-soft:#fbf0df;--danger:#c4302b;--danger-soft:#fce8e7;--muted-soft:#eceef2;--shadow:0 1px 2px rgba(16,24,40,.05),0 1px 3px rgba(16,24,40,.07);color-scheme:light`;
const ESCURO = `--bg:#0d1015;--bg-elev:#151a21;--bg-sunken:#10141a;--border:#232a34;--border-strong:#313a47;--text:#e8ebf0;--text-2:#aab2bf;--text-3:#7b8594;--accent:#6b8cff;--accent-soft:#1b2546;--ok:#3ccf8a;--ok-soft:#12291f;--info:#4cc3e0;--info-soft:#0f2830;--warn:#f0a53a;--warn-soft:#2e2213;--danger:#ff6b63;--danger-soft:#331716;--muted-soft:#1c222b;--shadow:0 1px 2px rgba(0,0,0,.4);color-scheme:dark`;

const CSS = `
:root{${CLARO};--radius:12px;--font:ui-sans-serif,-apple-system,"Segoe UI",Inter,Roboto,Arial,sans-serif;--mono:ui-monospace,"Cascadia Code",Menlo,Consolas,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){${ESCURO}}}
:root[data-theme=dark]{${ESCURO}}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.55 var(--font)}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
code{font-family:var(--mono);font-size:.88em;background:var(--bg-sunken);padding:1px 5px;border-radius:5px;overflow-wrap:anywhere}
h1{font-size:1.7rem;line-height:1.2;margin:0 0 6px}
h2{font-size:1.1rem;margin:28px 0 12px}
h3{font-size:1rem;margin:0 0 8px}
p{margin:0 0 10px}
.topo{position:sticky;top:0;z-index:10;background:color-mix(in srgb,var(--bg-elev) 82%,transparent);-webkit-backdrop-filter:saturate(1.4) blur(10px);backdrop-filter:saturate(1.4) blur(10px);border-bottom:1px solid var(--border);transition:box-shadow .2s ease}
.topo.rolou{box-shadow:0 6px 18px rgba(16,24,40,.12)}
.topo-in{max-width:1100px;margin:0 auto;padding:8px 16px;display:flex;align-items:center;gap:16px}
.marca{display:flex;align-items:center;gap:10px;color:var(--text);min-width:0;flex:none}
.marca:hover{text-decoration:none}
.marca-ico{flex:none;width:34px;height:34px;border-radius:10px;background:var(--accent);color:#fff;display:grid;place-items:center;font-weight:800;font-size:1rem}
.marca-txt{display:flex;flex-direction:column;min-width:0;line-height:1.2}
.marca-nome{font-weight:700;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.marca-dono{font-size:.76rem;color:var(--text-3);max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.menu{display:flex;gap:4px;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none}
.menu::-webkit-scrollbar{display:none}
.menu a{display:flex;align-items:center;gap:7px;padding:7px 12px;border-radius:999px;color:var(--text-2);font-weight:500;white-space:nowrap;transition:background-color .15s ease,color .15s ease}
.menu a:hover{background:var(--bg-sunken);color:var(--text);text-decoration:none}
.menu a.ativo{background:color-mix(in srgb,var(--accent) 16%,transparent);color:var(--accent)}
.menu svg,.tema svg{width:18px;height:18px;flex:none;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.selo{min-width:20px;padding:0 6px;border-radius:999px;background:var(--accent);color:#fff;font-size:.72rem;font-weight:700;line-height:20px;text-align:center}
.tema{flex:none;width:38px;height:38px;border:1px solid var(--border-strong);background:transparent;color:var(--text-2);border-radius:50%;display:grid;place-items:center;cursor:pointer;transition:background-color .15s ease,color .15s ease}
.tema:hover{background:var(--bg-sunken);color:var(--text)}
.tema .sol{display:none}
:root[data-theme=dark] .tema .sol{display:block}
:root[data-theme=dark] .tema .lua{display:none}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .tema .sol{display:block}:root:not([data-theme=light]) .tema .lua{display:none}}
a:focus-visible,button:focus-visible,summary:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.menu a:focus-visible{outline-offset:-2px}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important}}
main{max-width:1100px;margin:0 auto;padding:22px 16px 60px}
.sub{color:var(--text-2);margin:0 0 20px}
.grade{display:grid;gap:14px}
.g2{grid-template-columns:repeat(2,minmax(0,1fr))}
.g3{grid-template-columns:repeat(3,minmax(0,1fr))}
.g4{grid-template-columns:repeat(4,minmax(0,1fr))}
.card{background:var(--bg-elev);border:1px solid var(--border);border-radius:var(--radius);padding:16px;box-shadow:var(--shadow);min-width:0}
a.card{color:inherit}
a.card:hover{border-color:var(--border-strong);text-decoration:none}
.num{font-size:1.9rem;font-weight:700;line-height:1.1}
.rot{color:var(--text-3);font-size:.85rem}
.chips{display:flex;gap:6px;flex-wrap:wrap}
.badge{display:inline-block;padding:2px 9px;border-radius:999px;font-size:.78rem;font-weight:600;background:var(--muted-soft);color:var(--text-2);white-space:nowrap}
.badge.ok{background:var(--ok-soft);color:var(--ok)}
.badge.info{background:var(--info-soft);color:var(--info)}
.badge.warn{background:var(--warn-soft);color:var(--warn)}
.badge.danger{background:var(--danger-soft);color:var(--danger)}
.badge.accent{background:var(--accent-soft);color:var(--accent)}
.lista{list-style:none;margin:0;padding:0}
.lista li{padding:9px 0;border-top:1px solid var(--border)}
.lista li:first-child{border-top:0}
.linha{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.esp{flex:1}
.vazio{color:var(--text-3);font-style:italic}
.aviso{background:var(--warn-soft);color:var(--warn);border-radius:var(--radius);padding:12px 14px;margin-bottom:16px}
table{width:100%;border-collapse:collapse}
.rolagem{overflow-x:auto}
th,td{text-align:left;padding:8px 10px;border-top:1px solid var(--border);vertical-align:top}
th{color:var(--text-3);font-size:.8rem;font-weight:600;text-transform:uppercase;letter-spacing:.03em;border-top:0}
.barra{display:flex;height:8px;border-radius:99px;overflow:hidden;background:var(--muted-soft);min-width:60px}
.barra i{display:block;height:100%}
.barra .f{background:var(--ok)}
.barra .p{background:var(--warn)}
.crit{list-style:none;margin:0;padding:0}
.crit li{display:flex;gap:10px;padding:7px 0;border-top:1px solid var(--border)}
.crit li:first-child{border-top:0}
.marca-est{flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:.8rem;font-weight:700;background:var(--muted-soft);color:var(--text-3)}
.marca-est.feito{background:var(--ok-soft);color:var(--ok)}
.marca-est.parcial{background:var(--warn-soft);color:var(--warn)}
.diagrama{overflow:auto;background:var(--bg-elev);border:1px solid var(--border);border-radius:var(--radius);padding:8px}
.diagrama svg{display:block;max-width:none;height:auto}
.cartao-sugerido{border:1px dashed var(--border-strong);border-radius:10px;padding:12px;margin-bottom:12px}
.cartao-sugerido pre{white-space:pre-wrap;overflow-wrap:anywhere;margin:8px 0;font:inherit;background:var(--bg-sunken);padding:10px;border-radius:8px}
.btn{border:1px solid var(--border-strong);background:var(--bg-elev);color:var(--text);border-radius:8px;padding:6px 12px;font:inherit;cursor:pointer}
.btn:hover{background:var(--bg-sunken)}
.btn.feito{background:var(--ok-soft);color:var(--ok);border-color:var(--ok)}
.print{max-width:100%;border:1px solid var(--border);border-radius:10px;margin:6px 0}
.tempo{border-left:2px solid var(--border-strong);margin:0;padding:0 0 0 14px;list-style:none}
.tempo li{position:relative;padding:0 0 12px}
.tempo li::before{content:"";position:absolute;left:-20px;top:7px;width:10px;height:10px;border-radius:50%;background:var(--accent)}
.veredito{border-radius:var(--radius);padding:14px;border:1px solid var(--border)}
.veredito.aprovado{background:var(--ok-soft);border-color:var(--ok)}
.veredito.recusado{background:var(--danger-soft);border-color:var(--danger)}
.migalha{font-size:.88rem;color:var(--text-3);margin-bottom:10px}
details summary{cursor:pointer;color:var(--text-2);padding:6px 0}
@media (max-width:820px){.g3,.g4{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:560px){
.g2,.g3,.g4{grid-template-columns:minmax(0,1fr)}
h1{font-size:1.4rem}
.num{font-size:1.6rem}
.topo-in{gap:8px;padding:8px 12px}
.marca-dono{display:none}
.marca-nome{max-width:84px;font-size:.9rem}
.menu{gap:1px}
.menu a{padding:5px 6px}
.menu{justify-content:flex-start}
.menu a{flex-direction:column;gap:2px;padding:5px 10px;font-size:.68rem;border-radius:12px;position:relative}
.menu a .selo{position:absolute;top:0;right:2px;min-width:16px;line-height:16px;font-size:.62rem;padding:0 4px}
main{padding-top:16px}
}
@media (max-width:430px){.marca-txt{display:none}.topo-in{gap:6px}}
`;

const SCRIPT_TEMA_INICIAL = `try{var t=localStorage.getItem("painel-tema");if(t)document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

const SCRIPT = `
(function(){
var raiz=document.documentElement;
function atual(){var t=raiz.getAttribute("data-theme");if(t)return t;return window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}
var topo=document.getElementById("topo");
function rolar(){if(topo)topo.classList.toggle("rolou",window.scrollY>4)}
window.addEventListener("scroll",rolar,{passive:true});rolar();
var botao=document.getElementById("tema");
if(botao)botao.addEventListener("click",function(){var novo=atual()==="dark"?"light":"dark";raiz.setAttribute("data-theme",novo);try{localStorage.setItem("painel-tema",novo)}catch(e){}});
document.addEventListener("click",function(ev){
var alvo=ev.target.closest("[data-copiar]");
if(!alvo)return;
var origem=document.getElementById(alvo.getAttribute("data-copiar"));
if(!origem)return;
var texto=origem.textContent;
function ok(){var antes=alvo.textContent;alvo.textContent="Copiado";alvo.classList.add("feito");setTimeout(function(){alvo.textContent=antes;alvo.classList.remove("feito")},1400)}
if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(texto).then(ok,function(){})}
else{var area=document.createElement("textarea");area.value=texto;document.body.appendChild(area);area.select();try{document.execCommand("copy");ok()}catch(e){}document.body.removeChild(area)}
});
})();
`;

const ICONES = {
  dashboard: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  sistemas: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 3 7.5l9 4.5 9-4.5z"/><path d="m3 12 9 4.5 9-4.5"/><path d="m3 16.5 9 4.5 9-4.5"/></svg>',
  conexoes: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="12" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8.3 7.2 15.7 10.8M8.3 16.8l7.4-3.6"/></svg>',
  quadro: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/></svg>',
  sol: '<svg class="sol" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  lua: '<svg class="lua" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
};

export const MENU = [
  ["/", "Dashboard", "dashboard"],
  ["/sistemas", "Sistemas", "sistemas"],
  ["/sistemas/conexoes", "Conexões", "conexoes"],
  ["/quadro", "Quadro", "quadro"],
];

export function pagina({ titulo, ativo, ctx, corpo }) {
  const projeto = ctx.config.nome;
  const dono = ctx.config.dono;
  const abertos = ctx.quadro.situacoes.filter((s) => s.aberta).reduce((soma, s) => soma + s.itens.length, 0);
  const itens = MENU.map(([href, rotulo, icone]) => {
    const selo = href === "/quadro" && abertos ? `<span class="selo" title="${abertos} itens abertos">${abertos}</span>` : "";
    return `<a href="${href}"${href === ativo ? ' class="ativo" aria-current="page"' : ""}>${ICONES[icone]}<span>${rotulo}</span>${selo}</a>`;
  }).join("");
  const inicial = esc(String(projeto).trim().charAt(0).toUpperCase() || "P");
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titulo)} | ${esc(projeto)}</title>
<script>${SCRIPT_TEMA_INICIAL}</script>
<style>${CSS}</style>
</head>
<body>
<header class="topo" id="topo"><div class="topo-in"><a class="marca" href="/" title="${esc(projeto)}"><span class="marca-ico" aria-hidden="true">${inicial}</span><span class="marca-txt"><span class="marca-nome">${esc(projeto)}</span>${dono ? `<span class="marca-dono">${esc(dono)}</span>` : ""}</span></a><nav class="menu" aria-label="Principal">${itens}</nav><button id="tema" class="tema" type="button" aria-label="Alternar tema claro e escuro" title="Alternar tema">${ICONES.lua}${ICONES.sol}</button></div></header>
<main>
${corpo}
</main>
<script>${SCRIPT}</script>
</body>
</html>
`;
}
