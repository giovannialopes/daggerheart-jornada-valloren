import { describe, it, expect } from "vitest";
import {
  MAX_CURTOS_SEGUIDOS,
  podeDescansoCurto,
  podeDescansoLongo,
  aplicarDescansoCurto,
  aplicarDescansoLongo
} from "../../scripts/regras/descansos.js";

describe("podeDescansoCurto", () => {
  it("permite o terceiro curto seguido", () => {
    expect(podeDescansoCurto({ descansosCurtos: 2, emSantuario: false }).permitido).toBe(true);
  });

  it("nega o quarto curto seguido", () => {
    const r = podeDescansoCurto({ descansosCurtos: 3, emSantuario: false });
    expect(r.permitido).toBe(false);
    expect(r.motivo).toBe("JORNADA.descanso.limiteCurtos");
  });

  it("permite curto em santuário mesmo no limite", () => {
    expect(podeDescansoCurto({ descansosCurtos: 3, emSantuario: true }).permitido).toBe(true);
  });
});

describe("podeDescansoLongo", () => {
  it("permite dentro de santuário", () => {
    expect(podeDescansoLongo({ descansosCurtos: 1, emSantuario: true }).permitido).toBe(true);
  });

  it("nega fora de santuário", () => {
    const r = podeDescansoLongo({ descansosCurtos: 0, emSantuario: false });
    expect(r.permitido).toBe(false);
    expect(r.motivo).toBe("JORNADA.descanso.longoExigeSantuario");
  });
});

describe("aplicar", () => {
  it("curto incrementa o contador", () => {
    expect(aplicarDescansoCurto({ descansosCurtos: 1, emSantuario: false }).descansosCurtos).toBe(2);
  });

  it("longo zera o contador de curtos", () => {
    expect(aplicarDescansoLongo({ descansosCurtos: 3, emSantuario: true }).descansosCurtos).toBe(0);
  });

  it("não muta o estado recebido", () => {
    const original = { descansosCurtos: 1, emSantuario: false };
    aplicarDescansoCurto(original);
    expect(original.descansosCurtos).toBe(1);
  });

  it("MAX_CURTOS_SEGUIDOS é 3", () => {
    expect(MAX_CURTOS_SEGUIDOS).toBe(3);
  });
});
