import { describe, it, expect } from "vitest";
import {
  TIPO_HEX,
  vizinhos,
  saoAdjacentes,
  chaveHex,
  offsetDaChave
} from "../../scripts/regras/vizinhos-hex.js";

const ordenar = (lista) =>
  [...lista].sort((a, b) => a.i - b.i || a.j - b.j);

describe("chaveHex / offsetDaChave", () => {
  it("vai e volta", () => {
    expect(chaveHex({ i: 12, j: 7 })).toBe("12.7");
    expect(offsetDaChave("12.7")).toEqual({ i: 12, j: 7 });
  });

  it("aceita coordenadas negativas", () => {
    expect(offsetDaChave("-3.-1")).toEqual({ i: -3, j: -1 });
  });
});

describe("vizinhos", () => {
  it("sempre devolve seis hexes", () => {
    for (const tipo of Object.values(TIPO_HEX)) {
      expect(vizinhos({ i: 5, j: 5 }, tipo)).toHaveLength(6);
    }
  });

  it("odd-r, linha par: desloca para a esquerda", () => {
    expect(ordenar(vizinhos({ i: 4, j: 4 }, TIPO_HEX.ODD_R))).toEqual(
      ordenar([
        { i: 4, j: 5 },
        { i: 3, j: 4 },
        { i: 3, j: 3 },
        { i: 4, j: 3 },
        { i: 5, j: 3 },
        { i: 5, j: 4 }
      ])
    );
  });

  it("odd-r, linha ímpar: desloca para a direita", () => {
    expect(ordenar(vizinhos({ i: 5, j: 4 }, TIPO_HEX.ODD_R))).toEqual(
      ordenar([
        { i: 5, j: 5 },
        { i: 4, j: 5 },
        { i: 4, j: 4 },
        { i: 5, j: 3 },
        { i: 6, j: 4 },
        { i: 6, j: 5 }
      ])
    );
  });

  it("even-r é o odd-r com a paridade trocada", () => {
    expect(ordenar(vizinhos({ i: 4, j: 4 }, TIPO_HEX.EVEN_R))).toEqual(
      ordenar(vizinhos({ i: 5, j: 4 }, TIPO_HEX.ODD_R).map((v) => ({ i: v.i - 1, j: v.j })))
    );
  });

  it("odd-q, coluna par", () => {
    expect(ordenar(vizinhos({ i: 4, j: 4 }, TIPO_HEX.ODD_Q))).toEqual(
      ordenar([
        { i: 3, j: 4 },
        { i: 5, j: 4 },
        { i: 3, j: 3 },
        { i: 4, j: 3 },
        { i: 3, j: 5 },
        { i: 4, j: 5 }
      ])
    );
  });

  it("odd-q, coluna ímpar", () => {
    expect(ordenar(vizinhos({ i: 4, j: 5 }, TIPO_HEX.ODD_Q))).toEqual(
      ordenar([
        { i: 3, j: 5 },
        { i: 5, j: 5 },
        { i: 4, j: 4 },
        { i: 5, j: 4 },
        { i: 4, j: 6 },
        { i: 5, j: 6 }
      ])
    );
  });

  it("a vizinhança é recíproca", () => {
    for (const tipo of Object.values(TIPO_HEX)) {
      const centro = { i: 7, j: 3 };
      for (const v of vizinhos(centro, tipo)) {
        const devolta = vizinhos(v, tipo);
        expect(devolta).toContainEqual(centro);
      }
    }
  });

  it("tipo desconhecido cai para odd-r", () => {
    expect(vizinhos({ i: 4, j: 4 }, "inexistente")).toEqual(
      vizinhos({ i: 4, j: 4 }, TIPO_HEX.ODD_R)
    );
  });
});

describe("saoAdjacentes", () => {
  it("reconhece um vizinho", () => {
    expect(saoAdjacentes({ i: 4, j: 4 }, { i: 4, j: 5 }, TIPO_HEX.ODD_R)).toBe(true);
  });

  it("nega um hex distante", () => {
    expect(saoAdjacentes({ i: 4, j: 4 }, { i: 9, j: 9 }, TIPO_HEX.ODD_R)).toBe(false);
  });

  it("nega o próprio hex", () => {
    expect(saoAdjacentes({ i: 4, j: 4 }, { i: 4, j: 4 }, TIPO_HEX.ODD_R)).toBe(false);
  });
});

describe("offsetDaChave com chave malformada", () => {
  // Chaves malformadas não deveriam chegar aqui — `normalizarHexes` as descarta.
  // Os testes fixam o que acontece se uma escapar: nada de exceção, e um
  // offset visivelmente inválido.
  it("não lança e devolve coordenadas inválidas em texto puro", () => {
    const r = offsetDaChave("abc");
    expect(Number.isNaN(r.i)).toBe(true);
    expect(r.j).toBeUndefined();
  });

  it("deixa a coluna indefinida quando falta o separador", () => {
    const r = offsetDaChave("3");
    expect(r.i).toBe(3);
    expect(r.j).toBeUndefined();
  });

  it("ignora o excedente numa chave com partes demais", () => {
    expect(offsetDaChave("1.2.3")).toEqual({ i: 1, j: 2 });
  });
});
