import { describe, it, expect } from "vitest";
import { quantidadeDeDados, avaliarEncontro } from "../../scripts/regras/dados-encontro.js";
import { TERRENO } from "../../scripts/regras/custo-viagem.js";

describe("quantidadeDeDados", () => {
  it("rola um dado por ponto de terreno", () => {
    expect(quantidadeDeDados(TERRENO.OTIMO)).toBe(1);
    expect(quantidadeDeDados(TERRENO.EXTREMO)).toBe(4);
  });

  it("trata terreno inválido como bom", () => {
    expect(quantidadeDeDados(99)).toBe(2);
  });
});

describe("avaliarEncontro", () => {
  it("dispara quando um dado sai 1", () => {
    const r = avaliarEncontro([4, 1, 6]);
    expect(r.disparou).toBe(true);
    expect(r.uns).toEqual([1]);
  });

  it("registra todos os índices que saíram 1", () => {
    const r = avaliarEncontro([1, 1, 6]);
    expect(r.disparou).toBe(true);
    expect(r.uns).toEqual([0, 1]);
  });

  it("não dispara sem nenhum 1", () => {
    const r = avaliarEncontro([3, 5]);
    expect(r.disparou).toBe(false);
    expect(r.uns).toEqual([]);
  });

  it("soma o total dos dados", () => {
    expect(avaliarEncontro([3, 5]).total).toBe(8);
  });

  it("não dispara com lista vazia", () => {
    const r = avaliarEncontro([]);
    expect(r.disparou).toBe(false);
    expect(r.total).toBe(0);
  });
});
