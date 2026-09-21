import { describe, it, expect } from "vitest";
import { TERRENO, diasDeViagem, terrenoValido } from "../../scripts/regras/custo-viagem.js";

describe("diasDeViagem", () => {
  it("cobra 1 dia em terreno ótimo", () => {
    expect(diasDeViagem(TERRENO.OTIMO)).toBe(1);
  });

  it("cobra 4 dias em terreno extremo", () => {
    expect(diasDeViagem(TERRENO.EXTREMO)).toBe(4);
  });

  it("trata terreno inválido como bom", () => {
    expect(diasDeViagem(9)).toBe(TERRENO.BOM);
    expect(diasDeViagem(undefined)).toBe(TERRENO.BOM);
    expect(diasDeViagem(0)).toBe(TERRENO.BOM);
  });

  it("correnteza a favor reduz um dia", () => {
    expect(diasDeViagem(TERRENO.ACIDENTADO, { correnteza: true })).toBe(2);
  });

  it("correnteza nunca leva o custo abaixo de 1 dia", () => {
    expect(diasDeViagem(TERRENO.OTIMO, { correnteza: true })).toBe(1);
  });
});

describe("terrenoValido", () => {
  it("aceita apenas 1 a 4", () => {
    expect(terrenoValido(1)).toBe(true);
    expect(terrenoValido(4)).toBe(true);
    expect(terrenoValido(0)).toBe(false);
    expect(terrenoValido(5)).toBe(false);
    expect(terrenoValido("3")).toBe(false);
  });
});
