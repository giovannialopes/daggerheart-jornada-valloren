import { describe, it, expect } from "vitest";
import {
  HEX_PADRAO,
  normalizarHexes,
  tipoHexDaGrade,
  revelarVizinhos
} from "../../scripts/dados/hexes.js";
import { TIPO_HEX, chaveHex, vizinhos } from "../../scripts/regras/vizinhos-hex.js";
import { ESTADO_PADRAO, lerEstado, gravarEstado } from "../../scripts/dados/estado.js";

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

/** Stub de Scene: só o que `dados/` usa — grade e as duas flags. */
function cenaStub({ tipoGrade = 2, flags = {} } = {}) {
  return {
    grid: { type: tipoGrade },
    flags: { ...flags },
    gravacoes: 0,
    getFlag(_modulo, chave) {
      return this.flags[chave];
    },
    async setFlag(_modulo, chave, valor) {
      this.flags[chave] = valor;
      this.gravacoes += 1;
      return this;
    }
  };
}

describe("revelarVizinhos", () => {
  const destino = { i: 0, j: 0 };

  it("revela o próprio hex de destino", async () => {
    const scene = cenaStub();
    const novas = await revelarVizinhos(scene, destino);

    expect(novas).toContain(chaveHex(destino));
    expect(scene.flags.hexes[chaveHex(destino)].revelado).toBe(true);
  });

  it("revela os seis vizinhos", async () => {
    const scene = cenaStub();
    const novas = await revelarVizinhos(scene, destino);

    const esperados = vizinhos(destino, TIPO_HEX.ODD_R).map(chaveHex);
    for (const chave of esperados) {
      expect(novas).toContain(chave);
      expect(scene.flags.hexes[chave].revelado).toBe(true);
    }
    expect(novas).toHaveLength(7);
  });

  it("não reporta como novo um vizinho já revelado", async () => {
    const jaRevelado = chaveHex(vizinhos(destino, TIPO_HEX.ODD_R)[0]);
    const scene = cenaStub({ flags: { hexes: { [jaRevelado]: { revelado: true } } } });

    const novas = await revelarVizinhos(scene, destino);

    expect(novas).not.toContain(jaRevelado);
    expect(novas).toHaveLength(6);
    expect(scene.flags.hexes[jaRevelado].revelado).toBe(true);
  });

  it("preserva os dados já pintados do hex revelado", async () => {
    const chave = chaveHex(destino);
    const scene = cenaStub({ flags: { hexes: { [chave]: { habitat: "floresta", terreno: 3 } } } });

    await revelarVizinhos(scene, destino);

    expect(scene.flags.hexes[chave]).toMatchObject({
      habitat: "floresta",
      terreno: 3,
      revelado: true
    });
  });

  it("não grava quando nada mudou", async () => {
    const scene = cenaStub();
    await revelarVizinhos(scene, destino);
    const gravacoesDepoisDaPrimeira = scene.gravacoes;

    const novas = await revelarVizinhos(scene, destino);

    expect(novas).toEqual([]);
    expect(scene.gravacoes).toBe(gravacoesDepoisDaPrimeira);
  });

  it("devolve lista vazia numa cena sem grade hexagonal", async () => {
    const scene = cenaStub({ tipoGrade: 1 });

    expect(await revelarVizinhos(scene, destino)).toEqual([]);
    expect(scene.gravacoes).toBe(0);
  });
});

describe("lerEstado e gravarEstado", () => {
  it("devolve o padrão numa cena sem flag", () => {
    expect(lerEstado(cenaStub())).toEqual({ ...ESTADO_PADRAO });
  });

  it("devolve o padrão quando não há cena", () => {
    expect(lerEstado(null)).toEqual({ ...ESTADO_PADRAO });
  });

  it("completa campos ausentes da flag", () => {
    const scene = cenaStub({ flags: { estado: { dia: 7 } } });
    expect(lerEstado(scene)).toEqual({ ...ESTADO_PADRAO, dia: 7 });
  });

  it("mescla o patch preservando o resto do estado", async () => {
    const scene = cenaStub({ flags: { estado: { dia: 4, descansosCurtos: 2 } } });

    await gravarEstado(scene, { hexAtual: "1.2" });

    expect(lerEstado(scene)).toEqual({
      ...ESTADO_PADRAO,
      dia: 4,
      descansosCurtos: 2,
      hexAtual: "1.2"
    });
    expect(scene.gravacoes).toBe(1);
  });
});
