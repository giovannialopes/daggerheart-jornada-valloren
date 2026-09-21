/** Layouts de grade hexagonal em coordenadas de offset. */
export const TIPO_HEX = Object.freeze({
  ODD_R: "odd-r",
  EVEN_R: "even-r",
  ODD_Q: "odd-q",
  EVEN_Q: "even-q"
});

/**
 * Deslocamentos [di, dj] por layout, separados pela paridade da linha
 * (layouts -r) ou da coluna (layouts -q). Índice 0 = par, 1 = ímpar.
 */
const DESLOCAMENTOS = {
  [TIPO_HEX.ODD_R]: [
    [[0, 1], [-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0]],
    [[0, 1], [-1, 1], [-1, 0], [0, -1], [1, 0], [1, 1]]
  ],
  [TIPO_HEX.ODD_Q]: [
    [[-1, 0], [1, 0], [-1, -1], [0, -1], [-1, 1], [0, 1]],
    [[-1, 0], [1, 0], [0, -1], [1, -1], [0, 1], [1, 1]]
  ]
};

// even-r e even-q são os mesmos deslocamentos com a paridade invertida.
DESLOCAMENTOS[TIPO_HEX.EVEN_R] = [...DESLOCAMENTOS[TIPO_HEX.ODD_R]].reverse();
DESLOCAMENTOS[TIPO_HEX.EVEN_Q] = [...DESLOCAMENTOS[TIPO_HEX.ODD_Q]].reverse();

const ehLayoutPorColuna = (tipo) => tipo === TIPO_HEX.ODD_Q || tipo === TIPO_HEX.EVEN_Q;

/** @returns {string} chave canônica do hex, usada nas flags da Scene. */
export function chaveHex({ i, j }) {
  return `${i}.${j}`;
}

/** @returns {{i: number, j: number}} */
export function offsetDaChave(chave) {
  const [i, j] = chave.split(".").map(Number);
  return { i, j };
}

/**
 * Os seis hexes que tocam o hex dado.
 * @param {{i: number, j: number}} hex i = linha, j = coluna
 * @param {string} tipo um valor de TIPO_HEX
 * @returns {{i: number, j: number}[]} sempre seis
 */
export function vizinhos({ i, j }, tipo) {
  const tabela = DESLOCAMENTOS[tipo] ?? DESLOCAMENTOS[TIPO_HEX.ODD_R];
  const eixo = ehLayoutPorColuna(tipo) ? j : i;
  const paridade = Math.abs(eixo % 2);
  return tabela[paridade].map(([di, dj]) => ({ i: i + di, j: j + dj }));
}

/**
 * @returns {boolean} true se b for um dos seis vizinhos de a.
 */
export function saoAdjacentes(a, b, tipo) {
  return vizinhos(a, tipo).some((v) => v.i === b.i && v.j === b.j);
}
