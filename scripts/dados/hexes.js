import { TERRENO, terrenoValido } from "../regras/custo-viagem.js";
import { TIPO_HEX, chaveHex, vizinhos } from "../regras/vizinhos-hex.js";

export const MODULO = "daggerheart-jornada-valloren";
const FLAG_HEXES = "hexes";

export const HEX_PADRAO = Object.freeze({
  habitat: "",
  terreno: TERRENO.BOM,
  corrompido: false,
  revelado: false,
  santuario: false,
  regiao: null
});

const CHAVE_VALIDA = /^-?\d+\.-?\d+$/;

/**
 * Traduz CONST.GRID_TYPES para o nosso TIPO_HEX.
 * @param {number} gridType
 * @returns {string|null} null se a grade não for hexagonal
 */
export function tipoHexDaGrade(gridType) {
  switch (gridType) {
    case 2: return TIPO_HEX.ODD_R;
    case 3: return TIPO_HEX.EVEN_R;
    case 4: return TIPO_HEX.ODD_Q;
    case 5: return TIPO_HEX.EVEN_Q;
    default: return null;
  }
}

/**
 * Saneia o que veio da flag: descarta chaves malformadas e completa
 * campos ausentes, para que um mapa editado à mão não quebre a viagem.
 * @param {object|null|undefined} bruto
 * @returns {Record<string, object>}
 */
export function normalizarHexes(bruto) {
  const entrada = bruto ?? {};
  const saida = {};
  for (const [chave, valor] of Object.entries(entrada)) {
    if (!CHAVE_VALIDA.test(chave)) continue;
    const hex = { ...HEX_PADRAO, ...(valor ?? {}) };
    if (!terrenoValido(hex.terreno)) {
      console.warn(`${MODULO} | terreno inválido no hex ${chave}:`, hex.terreno);
      hex.terreno = HEX_PADRAO.terreno;
    }
    saida[chave] = hex;
  }
  return saida;
}

/** @returns {Record<string, object>} */
export function lerHexes(scene) {
  return normalizarHexes(scene?.getFlag(MODULO, FLAG_HEXES));
}

/** @returns {object} o hex pedido, ou uma cópia do padrão */
export function lerHex(scene, offset) {
  return lerHexes(scene)[chaveHex(offset)] ?? { ...HEX_PADRAO };
}

/** Grava (mesclando) os dados de um hex. Só o Mestre deve chamar. */
export async function gravarHex(scene, offset, dados) {
  const hexes = lerHexes(scene);
  const chave = chaveHex(offset);
  hexes[chave] = { ...HEX_PADRAO, ...hexes[chave], ...dados };
  await scene.setFlag(MODULO, FLAG_HEXES, hexes);
}

/**
 * Marca como revelado o hex dado e os seis vizinhos dele.
 * O próprio hex entra na conta porque é onde o grupo está: sem isso o token
 * ficaria debaixo da névoa no mapa dos jogadores.
 * @returns {Promise<string[]>} chaves que passaram de oculto para revelado
 */
export async function revelarVizinhos(scene, offset) {
  const tipo = tipoHexDaGrade(scene?.grid?.type);
  if (!tipo) return [];

  const hexes = lerHexes(scene);
  const novas = [];

  for (const alvo of [offset, ...vizinhos(offset, tipo)]) {
    const chave = chaveHex(alvo);
    const atual = hexes[chave] ?? { ...HEX_PADRAO };
    if (atual.revelado) continue;
    hexes[chave] = { ...atual, revelado: true };
    novas.push(chave);
  }

  if (novas.length > 0) await scene.setFlag(MODULO, FLAG_HEXES, hexes);
  return novas;
}
