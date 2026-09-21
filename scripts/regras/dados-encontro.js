import { TERRENO, terrenoValido } from "./custo-viagem.js";

/**
 * Quantos d6 rolar ao entrar num hex: um por ponto de terreno.
 * @param {number} terreno
 * @returns {number} 1..4
 */
export function quantidadeDeDados(terreno) {
  return terrenoValido(terreno) ? terreno : TERRENO.BOM;
}

/**
 * Lê os resultados dos d6. Qualquer 1 dispara o encontro.
 * @param {number[]} resultados
 * @returns {{disparou: boolean, uns: number[], total: number}}
 */
export function avaliarEncontro(resultados) {
  const lista = Array.isArray(resultados) ? resultados : [];
  const uns = [];
  let total = 0;

  lista.forEach((valor, indice) => {
    total += valor;
    if (valor === 1) uns.push(indice);
  });

  return { disparou: uns.length > 0, uns, total };
}
