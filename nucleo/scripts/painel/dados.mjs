import { join } from "node:path";
import { lerConfig, lerJson } from "./config.mjs";
import { lerConexoes } from "./conexoes-core.mjs";
import { lerDecisoes, lerHandoff } from "./handoff.mjs";
import { lerQuadro } from "./quadro.mjs";

export function carregar(raiz) {
  const config = lerConfig(raiz);
  const mapa = lerJson(join(raiz, "docs", "painel", "mapa.json"), null);
  const manual = lerJson(join(raiz, "docs", "SISTEMAS.json"), {});
  return {
    raiz,
    config,
    mapa,
    sistemasManual: manual.sistemas ?? {},
    quadro: lerQuadro(raiz, config),
    handoff: lerHandoff(raiz, config.handoff),
    decisoes: lerDecisoes(raiz),
    conexoes: lerConexoes(raiz),
  };
}
