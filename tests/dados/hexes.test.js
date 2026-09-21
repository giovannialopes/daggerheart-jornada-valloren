import { describe, it, expect } from "vitest";
import { HEX_PADRAO, normalizarHexes, tipoHexDaGrade } from "../../scripts/dados/hexes.js";
import { TIPO_HEX } from "../../scripts/regras/vizinhos-hex.js";

describe("normalizarHexes", () => {
  it("completa campos ausentes com o padrão", () => {
    const r = normalizarHexes({ "1.1": { habitat: "floresta" } });
    expect(r["1.1"]).toEqual({ ...HEX_PADRAO, habitat: "floresta" });
  });

  it("corrige terreno fora da faixa", () => {
    expect(normalizarHexes({ "1.1": { terreno: 99 } })["1.1"].terreno).toBe(2);
    expect(normalizarHexes({ "1.1": { terreno: 0 } })["1.1"].terreno).toBe(2);
  });

  it("preserva terreno válido", () => {
    expect(normalizarHexes({ "1.1": { terreno: 4 } })["1.1"].terreno).toBe(4);
  });

  it("descarta chaves malformadas", () => {
    const r = normalizarHexes({ "abc": {}, "1.1": {}, "2": {} });
    expect(Object.keys(r)).toEqual(["1.1"]);
  });

  it("aceita entrada nula ou vazia", () => {
    expect(normalizarHexes(null)).toEqual({});
    expect(normalizarHexes(undefined)).toEqual({});
  });
});

describe("tipoHexDaGrade", () => {
  // CONST.GRID_TYPES: GRIDLESS 0, SQUARE 1,
  // HEXODDR 2, HEXEVENR 3, HEXODDQ 4, HEXEVENQ 5
  it("mapeia os quatro layouts hexagonais", () => {
    expect(tipoHexDaGrade(2)).toBe(TIPO_HEX.ODD_R);
    expect(tipoHexDaGrade(3)).toBe(TIPO_HEX.EVEN_R);
    expect(tipoHexDaGrade(4)).toBe(TIPO_HEX.ODD_Q);
    expect(tipoHexDaGrade(5)).toBe(TIPO_HEX.EVEN_Q);
  });

  it("devolve null para grades não hexagonais", () => {
    expect(tipoHexDaGrade(0)).toBeNull();
    expect(tipoHexDaGrade(1)).toBeNull();
    expect(tipoHexDaGrade(undefined)).toBeNull();
  });
});
