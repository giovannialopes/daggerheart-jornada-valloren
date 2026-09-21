/** Classificações de terreno. O valor é também o número base de dias. */
export const TERRENO = Object.freeze({
  OTIMO: 1,
  BOM: 2,
  ACIDENTADO: 3,
  EXTREMO: 4
});

/** @returns {boolean} true se for um inteiro de 1 a 4. */
export function terrenoValido(terreno) {
  return Number.isInteger(terreno) && terreno >= TERRENO.OTIMO && terreno <= TERRENO.EXTREMO;
}

/**
 * Dias de viagem para entrar num hex.
 * Terreno inválido cai para BOM, para que um mapa mal preenchido
 * não trave a viagem.
 * @param {number} terreno
 * @param {{correnteza?: boolean}} [opcoes] correnteza: rio a favor, -1 dia
 * @returns {number} 1..4
 */
export function diasDeViagem(terreno, { correnteza = false } = {}) {
  const base = terrenoValido(terreno) ? terreno : TERRENO.BOM;
  const custo = correnteza ? base - 1 : base;
  return Math.max(1, custo);
}
