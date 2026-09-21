/**
 * Estrutura da Trilha da Perdição: quatro tiers, três caixas por tier.
 * Dentro de um tier as caixas são aninhadas em sequência — a segunda só
 * abre depois da primeira. O texto do evento de cada caixa é escrito pelo
 * Mestre e guardado à parte, no setting de mundo.
 */
export const ESTRUTURA_PERDICAO = Object.freeze(
  [1, 2, 3, 4].flatMap((tier) =>
    ["a", "b", "c"].map((letra, indice) => ({
      id: `t${tier}-${letra}`,
      tier,
      pai: indice === 0 ? null : `t${tier}-${["a", "b", "c"][indice - 1]}`
    }))
  )
);

const PORID = new Map(ESTRUTURA_PERDICAO.map((c) => [c.id, c]));

/**
 * @param {string[]} marcadas ids já marcados
 * @param {number} tier tier atual do grupo
 * @param {string} id caixa candidata
 * @returns {boolean}
 */
export function podeMarcar(marcadas, tier, id) {
  const caixa = PORID.get(id);
  if (!caixa) return false;
  if (caixa.tier > tier) return false;
  if (marcadas.includes(id)) return false;
  if (caixa.pai !== null && !marcadas.includes(caixa.pai)) return false;
  return true;
}

/**
 * @param {string[]} marcadas
 * @param {number} tier
 * @returns {string[]} ids que o Mestre pode marcar agora
 */
export function caixasDisponiveis(marcadas, tier) {
  return ESTRUTURA_PERDICAO.filter((c) => podeMarcar(marcadas, tier, c.id)).map((c) => c.id);
}

/**
 * @param {string[]} marcadas
 * @param {string} id
 * @returns {string[]} nova lista
 */
export function marcarCaixa(marcadas, id) {
  return marcadas.includes(id) ? [...marcadas] : [...marcadas, id];
}
