import { describe, it, expect } from "vitest";
import {
  ESTRUTURA_PERDICAO,
  caixasDisponiveis,
  podeMarcar,
  marcarCaixa
} from "../../scripts/regras/perdicao.js";

describe("ESTRUTURA_PERDICAO", () => {
  it("tem quatro tiers com três caixas cada", () => {
    expect(ESTRUTURA_PERDICAO).toHaveLength(12);
    for (const tier of [1, 2, 3, 4]) {
      expect(ESTRUTURA_PERDICAO.filter((c) => c.tier === tier)).toHaveLength(3);
    }
  });

  it("a primeira caixa de cada tier não tem pai", () => {
    for (const tier of [1, 2, 3, 4]) {
      const primeira = ESTRUTURA_PERDICAO.find((c) => c.tier === tier);
      expect(primeira.pai).toBeNull();
    }
  });
});

describe("podeMarcar", () => {
  it("permite a primeira caixa do tier 1", () => {
    expect(podeMarcar([], 1, "t1-a")).toBe(true);
  });

  it("nega caixa de tier acima do tier do grupo", () => {
    expect(podeMarcar([], 1, "t2-a")).toBe(false);
  });

  it("permite caixa de tier abaixo do tier do grupo", () => {
    expect(podeMarcar([], 3, "t1-a")).toBe(true);
  });

  it("nega caixa aninhada com o pai desmarcado", () => {
    expect(podeMarcar([], 1, "t1-b")).toBe(false);
  });

  it("permite caixa aninhada com o pai marcado", () => {
    expect(podeMarcar(["t1-a"], 1, "t1-b")).toBe(true);
  });

  it("nega caixa já marcada", () => {
    expect(podeMarcar(["t1-a"], 1, "t1-a")).toBe(false);
  });

  it("nega id inexistente", () => {
    expect(podeMarcar([], 1, "nao-existe")).toBe(false);
  });
});

describe("caixasDisponiveis", () => {
  it("no início oferece só a primeira caixa do tier 1", () => {
    expect(caixasDisponiveis([], 1)).toEqual(["t1-a"]);
  });

  it("com o tier 1 completo e grupo no tier 2, oferece a primeira do tier 2", () => {
    expect(caixasDisponiveis(["t1-a", "t1-b", "t1-c"], 2)).toEqual(["t2-a"]);
  });

  it("não oferece nada quando tudo do tier está marcado", () => {
    expect(caixasDisponiveis(["t1-a", "t1-b", "t1-c"], 1)).toEqual([]);
  });
});

describe("marcarCaixa", () => {
  it("acrescenta a caixa", () => {
    expect(marcarCaixa([], "t1-a")).toEqual(["t1-a"]);
  });

  it("não duplica", () => {
    expect(marcarCaixa(["t1-a"], "t1-a")).toEqual(["t1-a"]);
  });

  it("não muta a lista recebida", () => {
    const original = ["t1-a"];
    marcarCaixa(original, "t1-b");
    expect(original).toEqual(["t1-a"]);
  });
});
