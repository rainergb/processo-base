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
.topo{position:sticky;top:0;z-index:5;background:var(--bg-elev);border-bottom:1px solid var(--border)}
.topo-in{max-width:1100px;margin:0 auto;padding:10px 16px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.marca{font-weight:700;color:var(--text);margin-right:6px}
.menu{display:flex;gap:4px;flex-wrap:wrap;flex:1}
.menu a{padding:6px 11px;border-radius:8px;color:var(--text-2);font-weight:500}
.menu a:hover{background:var(--bg-sunken);text-decoration:none}
.menu a.ativo{background:var(--accent-soft);color:var(--accent)}
.tema{border:1px solid var(--border-strong);background:var(--bg-elev);color:var(--text);border-radius:8px;padding:5px 10px;font:inherit;cursor:pointer}
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
.topo-in{gap:8px}
.menu a{padding:5px 8px;font-size:.92rem}
main{padding-top:16px}
}
`;

const SCRIPT_TEMA_INICIAL = `try{var t=localStorage.getItem("painel-tema");if(t)document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

const SCRIPT = `
(function(){
var raiz=document.documentElement;
function atual(){var t=raiz.getAttribute("data-theme");if(t)return t;return window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}
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

export const MENU = [
  ["/", "Dashboard"],
  ["/sistemas", "Sistemas"],
  ["/sistemas/conexoes", "Conexões"],
  ["/quadro", "Quadro"],
];

export function pagina({ titulo, ativo, projeto, corpo }) {
  const itens = MENU.map(([href, rotulo]) => `<a href="${href}"${href === ativo ? ' class="ativo"' : ""}>${rotulo}</a>`).join("");
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
<header class="topo"><div class="topo-in"><span class="marca">${esc(projeto)}</span><nav class="menu">${itens}</nav><button id="tema" class="tema" type="button" aria-label="Alternar tema claro e escuro">Tema</button></div></header>
<main>
${corpo}
</main>
<script>${SCRIPT}</script>
</body>
</html>
`;
}
