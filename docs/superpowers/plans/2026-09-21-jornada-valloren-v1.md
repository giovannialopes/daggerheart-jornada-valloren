# Jornada por Valloren v1 — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a v1 do módulo `daggerheart-jornada-valloren`: viagem por hexágonos com custo em dias, revelação progressiva do mapa dos jogadores, Dados de Encontro, controle de descansos e Trilha da Perdição.

**Architecture:** Toda regra de jogo vive em `scripts/regras/`, sem nenhum import do Foundry, e é coberta por testes Vitest. A integração com o Foundry (flags, canvas, UI) fica em camadas separadas que consomem essas regras. O mapa é uma flag esparsa na Scene; a névoa é desenhada pelo módulo numa camada própria, não pela fog of war nativa.

**Tech Stack:** JavaScript ES2022 (ESM), Foundry VTT v14 API (`foundry.canvas.layers.*`, `foundry.applications.api.ApplicationV2`, `foundry.applications.api.DialogV2`), Vitest para os testes, sistema `daggerheart` 2.9.3+.

## Global Constraints

- **ID do módulo:** `daggerheart-jornada-valloren`. Toda flag usa esse namespace exato.
- **Foundry:** `compatibility.minimum` = `"13"`, `verified` = `"14"`.
- **Sistema:** relacionamento com `daggerheart`, `compatibility.minimum` = `"2.9.0"`.
- **Idioma:** toda string visível ao usuário vem de `lang/pt-BR.json`. Nada de texto literal em português dentro do `.js`.
- **Nomenclatura:** arquivos, funções e chaves de dados em português, conforme o spec.
- **Conteúdo:** nenhuma tabela, texto ou arte do livro *Hope & Fear* entra no repositório. As caixas da Trilha da Perdição nascem sem texto e são preenchidas pelo Mestre.
- **Chave de hex:** sempre a string `` `${i}.${j}` `` onde `i` é a linha e `j` a coluna do offset da grade.
- **Camada de canvas:** registrar em `CONFIG.Canvas.layers.jornada`. Nunca sobrescrever `regions` nem `tokens` — o sistema Daggerheart já usa essas duas.
- **Commits:** mensagem em português, sem prefixo `feat:`/`fix:`, seguindo o padrão do repositório.

---

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `module.json` | Manifesto |
| `package.json` | Vitest e scripts |
| `scripts/regras/custo-viagem.js` | Terreno → dias de viagem |
| `scripts/regras/dados-encontro.js` | Monta Nd6, detecta `1`, decide disparo |
| `scripts/regras/descansos.js` | Limite de curtos, longo só em santuário |
| `scripts/regras/perdicao.js` | Quais caixas o tier libera |
| `scripts/regras/vizinhos-hex.js` | Vizinhos de um hex por tipo de grade |
| `scripts/dados/hexes.js` | Leitura/escrita da flag do mapa |
| `scripts/dados/estado.js` | Leitura/escrita do estado da jornada |
| `scripts/canvas/camada-hex.js` | Desenho de símbolos, terreno e névoa |
| `scripts/canvas/ferramenta-pintar.js` | Diálogo de pintar hex |
| `scripts/fluxo/viagem.js` | Movimento → custo → revelação → encontro |
| `scripts/fluxo/encontro.js` | Card de chat e botão de Medo |
| `scripts/ui/painel-jornada.js` | Painel de dia/descansos/Perdição |
| `scripts/main.js` | Registro de hooks, settings, camada |
| `lang/pt-BR.json` | Strings |
| `styles/jornada.css` | Estilos do painel |
| `docs/verificacao-manual.md` | Roteiro de teste manual |

---

## Task 1: Scaffold do projeto e regra de custo de viagem

**Files:**
- Create: `package.json`, `vitest.config.js`, `module.json`, `lang/pt-BR.json`
- Create: `scripts/regras/custo-viagem.js`
- Test: `tests/regras/custo-viagem.test.js`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `TERRENO = { OTIMO: 1, BOM: 2, ACIDENTADO: 3, EXTREMO: 4 }`
  - `diasDeViagem(terreno, { correnteza = false } = {}) -> number` (1..4)
  - `terrenoValido(terreno) -> boolean`

- [ ] **Step 1: Criar `package.json`**

```json
{
  "name": "daggerheart-jornada-valloren",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Criar `vitest.config.js`**

```js
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.js"],
    environment: "node"
  }
});
```

- [ ] **Step 3: Instalar dependências**

Run: `npm install`
Expected: `node_modules/` criado, sem erros.

- [ ] **Step 4: Criar `module.json`**

```json
{
  "id": "daggerheart-jornada-valloren",
  "title": "Daggerheart - Jornada por Valloren",
  "description": "<p>Ferramenta de viagem por hexagonos para Daggerheart: custo em dias por terreno, revelacao progressiva do mapa, Dados de Encontro, controle de descansos e Trilha da Perdicao.</p><p><strong>Conteudo nao oficial.</strong> Ferramenta de mesa feita por fa, sem afiliacao com a Darrington Press ou a Jambo Editora. As tabelas incluidas sao autorais.</p>",
  "version": "0.1.0",
  "authors": [{ "name": "Giovanni Alopes", "url": "https://github.com/giovannialopes" }],
  "compatibility": { "minimum": "13", "verified": "14" },
  "esmodules": ["scripts/main.js"],
  "styles": ["styles/jornada.css"],
  "languages": [
    { "lang": "pt-BR", "name": "Português (Brasil)", "path": "lang/pt-BR.json" }
  ],
  "relationships": {
    "systems": [
      { "id": "daggerheart", "type": "system", "compatibility": { "minimum": "2.9.0" } }
    ]
  },
  "url": "https://github.com/giovannialopes/daggerheart-jornada-valloren",
  "manifest": "https://github.com/giovannialopes/daggerheart-jornada-valloren/releases/latest/download/module.json",
  "download": "https://github.com/giovannialopes/daggerheart-jornada-valloren/releases/latest/download/module.zip"
}
```

- [ ] **Step 5: Criar `lang/pt-BR.json` com as chaves iniciais**

```json
{
  "JORNADA": {
    "terreno": {
      "1": "Ótimo",
      "2": "Bom",
      "3": "Acidentado",
      "4": "Extremo"
    },
    "dias": {
      "um": "1 dia de viagem",
      "varios": "{dias} dias de viagem"
    }
  }
}
```

- [ ] **Step 6: Escrever o teste que falha**

Create `tests/regras/custo-viagem.test.js`:

```js
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
```

- [ ] **Step 7: Rodar o teste e confirmar a falha**

Run: `npm test`
Expected: FAIL — `Failed to resolve import ... custo-viagem.js`

- [ ] **Step 8: Implementar `scripts/regras/custo-viagem.js`**

```js
/** Classificações de terreno. O valor é também o número base de dias. */
export const TERRENO = Object.freeze({
  OTIMO: 1,
  BOM: 2,
  ACIDENTADO: 3,
  EXTREMO: 4
});

/** @returns {boolean} true se for um inteiro de 1 a 4. */
export function terrenoValido(terreno) {
  return Number.isInteger(terreno) && terreno >= TERRENO.OTIMO && terreno <= TERRENO.EXTREMO;
}

/**
 * Dias de viagem para entrar num hex.
 * Terreno inválido cai para BOM, para que um mapa mal preenchido
 * não trave a viagem.
 * @param {number} terreno
 * @param {{correnteza?: boolean}} [opcoes] correnteza: rio a favor, -1 dia
 * @returns {number} 1..4
 */
export function diasDeViagem(terreno, { correnteza = false } = {}) {
  const base = terrenoValido(terreno) ? terreno : TERRENO.BOM;
  const custo = correnteza ? base - 1 : base;
  return Math.max(1, custo);
}
```

- [ ] **Step 9: Rodar os testes e confirmar que passam**

Run: `npm test`
Expected: PASS — 6 testes.

- [ ] **Step 10: Commit**

```bash
git add package.json vitest.config.js module.json lang/pt-BR.json scripts/regras/custo-viagem.js tests/regras/custo-viagem.test.js
git commit -m "Adiciona scaffold do modulo e a regra de custo de viagem"
```

---

## Task 2: Dados de Encontro

**Files:**
- Create: `scripts/regras/dados-encontro.js`
- Test: `tests/regras/dados-encontro.test.js`

**Interfaces:**
- Consumes: `terrenoValido`, `TERRENO` de `custo-viagem.js`.
- Produces:
  - `quantidadeDeDados(terreno) -> number` (1..4)
  - `avaliarEncontro(resultados) -> { disparou: boolean, uns: number[], total: number }`
    onde `uns` são os **índices** (base 0) dos dados que saíram 1.

A rolagem em si acontece no Foundry (Task 8). Este módulo só decide o que os resultados significam, o que o mantém puro e testável.

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/regras/dados-encontro.test.js`:

```js
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
```

- [ ] **Step 2: Rodar o teste e confirmar a falha**

Run: `npm test`
Expected: FAIL — import não resolvido.

- [ ] **Step 3: Implementar `scripts/regras/dados-encontro.js`**

```js
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
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npm test`
Expected: PASS — 13 testes no total.

- [ ] **Step 5: Commit**

```bash
git add scripts/regras/dados-encontro.js tests/regras/dados-encontro.test.js
git commit -m "Adiciona a regra dos Dados de Encontro"
```

---

## Task 3: Regras de descanso

**Files:**
- Create: `scripts/regras/descansos.js`
- Test: `tests/regras/descansos.test.js`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `MAX_CURTOS_SEGUIDOS = 3`
  - `podeDescansoCurto(estado) -> { permitido: boolean, motivo: string|null }`
  - `podeDescansoLongo(estado) -> { permitido: boolean, motivo: string|null }`
  - `aplicarDescansoCurto(estado) -> estado`
  - `aplicarDescansoLongo(estado) -> estado`

`estado` é `{ descansosCurtos: number, emSantuario: boolean }`. As funções de aplicar retornam um **novo** objeto; não mutam a entrada. `motivo` é uma chave de i18n, não texto pronto.

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/regras/descansos.test.js`:

```js
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
```

- [ ] **Step 2: Rodar o teste e confirmar a falha**

Run: `npm test`
Expected: FAIL — import não resolvido.

- [ ] **Step 3: Implementar `scripts/regras/descansos.js`**

```js
/** Fora de santuário, o grupo só pode encadear três descansos curtos. */
export const MAX_CURTOS_SEGUIDOS = 3;

const OK = Object.freeze({ permitido: true, motivo: null });

/**
 * @param {{descansosCurtos: number, emSantuario: boolean}} estado
 * @returns {{permitido: boolean, motivo: string|null}} motivo é chave de i18n
 */
export function podeDescansoCurto(estado) {
  if (estado.emSantuario) return OK;
  if (estado.descansosCurtos >= MAX_CURTOS_SEGUIDOS) {
    return { permitido: false, motivo: "JORNADA.descanso.limiteCurtos" };
  }
  return OK;
}

/**
 * @param {{descansosCurtos: number, emSantuario: boolean}} estado
 * @returns {{permitido: boolean, motivo: string|null}}
 */
export function podeDescansoLongo(estado) {
  if (!estado.emSantuario) {
    return { permitido: false, motivo: "JORNADA.descanso.longoExigeSantuario" };
  }
  return OK;
}

/** @returns {object} novo estado com um curto a mais */
export function aplicarDescansoCurto(estado) {
  return { ...estado, descansosCurtos: estado.descansosCurtos + 1 };
}

/** @returns {object} novo estado com o contador de curtos zerado */
export function aplicarDescansoLongo(estado) {
  return { ...estado, descansosCurtos: 0 };
}
```

- [ ] **Step 4: Adicionar as chaves de i18n usadas**

Modify `lang/pt-BR.json` — acrescentar dentro de `"JORNADA"`:

```json
    "descanso": {
      "limiteCurtos": "O grupo já fez três descansos curtos seguidos. O próximo precisa ser longo, e longo só em santuário.",
      "longoExigeSantuario": "Descanso longo só é possível dentro de um santuário."
    }
```

- [ ] **Step 5: Rodar os testes e confirmar que passam**

Run: `npm test`
Expected: PASS — 22 testes no total.

- [ ] **Step 6: Commit**

```bash
git add scripts/regras/descansos.js tests/regras/descansos.test.js lang/pt-BR.json
git commit -m "Adiciona as regras de descanso curto e longo"
```

---

## Task 4: Trilha da Perdição

**Files:**
- Create: `scripts/regras/perdicao.js`
- Test: `tests/regras/perdicao.test.js`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `ESTRUTURA_PERDICAO` — array de `{ id, tier, pai }`, com `pai` sendo o `id` da caixa que precisa estar marcada antes, ou `null`.
  - `caixasDisponiveis(marcadas, tier) -> string[]`
  - `podeMarcar(marcadas, tier, id) -> boolean`
  - `marcarCaixa(marcadas, id) -> string[]`

**Nota de conteúdo:** as caixas nascem sem texto. O texto do evento de cada caixa é escrito pelo Mestre e guardado no setting de mundo (Task 9). Nenhum evento do livro entra aqui.

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/regras/perdicao.test.js`:

```js
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
```

- [ ] **Step 2: Rodar o teste e confirmar a falha**

Run: `npm test`
Expected: FAIL — import não resolvido.

- [ ] **Step 3: Implementar `scripts/regras/perdicao.js`**

```js
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
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npm test`
Expected: PASS — 37 testes no total.

- [ ] **Step 5: Commit**

```bash
git add scripts/regras/perdicao.js tests/regras/perdicao.test.js
git commit -m "Adiciona a estrutura e as regras da Trilha da Perdicao"
```

---

## Task 5: Vizinhança hexagonal

**Files:**
- Create: `scripts/regras/vizinhos-hex.js`
- Test: `tests/regras/vizinhos-hex.test.js`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `TIPO_HEX = { ODD_R: "odd-r", EVEN_R: "even-r", ODD_Q: "odd-q", EVEN_Q: "even-q" }`
  - `vizinhos({ i, j }, tipo) -> {i, j}[]` — sempre 6 elementos
  - `saoAdjacentes(a, b, tipo) -> boolean`
  - `chaveHex({ i, j }) -> string` e `offsetDaChave(chave) -> {i, j}`

Foundry entrega o tipo da grade em `canvas.grid.type` (`CONST.GRID_TYPES.HEXODDR` etc.); a tradução para `TIPO_HEX` acontece na Task 6, mantendo este arquivo livre do Foundry.

`i` é a linha, `j` é a coluna. Nas grades `-r` (topo pontudo) as linhas ímpares ou pares são deslocadas para a direita; nas `-q` (topo plano) as colunas são deslocadas para baixo.

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/regras/vizinhos-hex.test.js`:

```js
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
```

- [ ] **Step 2: Rodar o teste e confirmar a falha**

Run: `npm test`
Expected: FAIL — import não resolvido.

- [ ] **Step 3: Implementar `scripts/regras/vizinhos-hex.js`**

```js
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
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npm test`
Expected: PASS — 50 testes no total. O teste de reciprocidade é o que pega erro de paridade; se ele falhar, o bug está na tabela `DESLOCAMENTOS`.

- [ ] **Step 5: Commit**

```bash
git add scripts/regras/vizinhos-hex.js tests/regras/vizinhos-hex.test.js
git commit -m "Adiciona o calculo de vizinhanca hexagonal"
```

---

## Task 6: Camada de dados sobre as flags da Scene

**Files:**
- Create: `scripts/dados/hexes.js`, `scripts/dados/estado.js`
- Test: `tests/dados/hexes.test.js`

**Interfaces:**
- Consumes: `chaveHex`, `offsetDaChave`, `vizinhos`, `TIPO_HEX` de `vizinhos-hex.js`; `TERRENO` de `custo-viagem.js`.
- Produces, em `hexes.js`:
  - `MODULO = "daggerheart-jornada-valloren"`
  - `HEX_PADRAO` — `{ habitat: "", terreno: 2, corrompido: false, revelado: false, santuario: false, regiao: null }`
  - `normalizarHexes(bruto) -> Record<string, object>` (**puro**, testável)
  - `tipoHexDaGrade(gridType) -> string` (**puro**, recebe o número de `CONST.GRID_TYPES`)
  - `lerHexes(scene) -> Record<string, object>`
  - `lerHex(scene, offset) -> object`
  - `gravarHex(scene, offset, dados) -> Promise<void>`
  - `revelarVizinhos(scene, offset) -> Promise<string[]>` — devolve as chaves reveladas agora
- Produces, em `estado.js`:
  - `ESTADO_PADRAO` — `{ dia: 1, tokenGrupoId: null, hexAtual: null, descansosCurtos: 0 }`
  - `lerEstado(scene) -> object`, `gravarEstado(scene, patch) -> Promise<void>`

As duas funções puras (`normalizarHexes`, `tipoHexDaGrade`) são as que ganham teste; o resto toca a API da Scene e é coberto pelo roteiro manual.

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/dados/hexes.test.js`:

```js
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
```

- [ ] **Step 2: Rodar o teste e confirmar a falha**

Run: `npm test`
Expected: FAIL — import não resolvido.

- [ ] **Step 3: Implementar `scripts/dados/hexes.js`**

```js
import { TERRENO, terrenoValido } from "../regras/custo-viagem.js";
import { TIPO_HEX, chaveHex, vizinhos } from "../regras/vizinhos-hex.js";

export const MODULO = "daggerheart-jornada-valloren";
const FLAG_HEXES = "hexes";

export const HEX_PADRAO = Object.freeze({
  habitat: "",
  terreno: TERRENO.BOM,
  corrompido: false,
  revelado: false,
  santuario: false,
  regiao: null
});

const CHAVE_VALIDA = /^-?\d+\.-?\d+$/;

/**
 * Traduz CONST.GRID_TYPES para o nosso TIPO_HEX.
 * @param {number} gridType
 * @returns {string|null} null se a grade não for hexagonal
 */
export function tipoHexDaGrade(gridType) {
  switch (gridType) {
    case 2: return TIPO_HEX.ODD_R;
    case 3: return TIPO_HEX.EVEN_R;
    case 4: return TIPO_HEX.ODD_Q;
    case 5: return TIPO_HEX.EVEN_Q;
    default: return null;
  }
}

/**
 * Saneia o que veio da flag: descarta chaves malformadas e completa
 * campos ausentes, para que um mapa editado à mão não quebre a viagem.
 * @param {object|null|undefined} bruto
 * @returns {Record<string, object>}
 */
export function normalizarHexes(bruto) {
  const entrada = bruto ?? {};
  const saida = {};
  for (const [chave, valor] of Object.entries(entrada)) {
    if (!CHAVE_VALIDA.test(chave)) continue;
    const hex = { ...HEX_PADRAO, ...(valor ?? {}) };
    if (!terrenoValido(hex.terreno)) {
      console.warn(`${MODULO} | terreno inválido no hex ${chave}:`, hex.terreno);
      hex.terreno = HEX_PADRAO.terreno;
    }
    saida[chave] = hex;
  }
  return saida;
}

/** @returns {Record<string, object>} */
export function lerHexes(scene) {
  return normalizarHexes(scene?.getFlag(MODULO, FLAG_HEXES));
}

/** @returns {object} o hex pedido, ou uma cópia do padrão */
export function lerHex(scene, offset) {
  return lerHexes(scene)[chaveHex(offset)] ?? { ...HEX_PADRAO };
}

/** Grava (mesclando) os dados de um hex. Só o Mestre deve chamar. */
export async function gravarHex(scene, offset, dados) {
  const hexes = lerHexes(scene);
  const chave = chaveHex(offset);
  hexes[chave] = { ...HEX_PADRAO, ...hexes[chave], ...dados };
  await scene.setFlag(MODULO, FLAG_HEXES, hexes);
}

/**
 * Marca como revelados os seis vizinhos do hex dado.
 * @returns {Promise<string[]>} chaves que passaram de oculto para revelado
 */
export async function revelarVizinhos(scene, offset) {
  const tipo = tipoHexDaGrade(scene.grid?.type);
  if (!tipo) return [];

  const hexes = lerHexes(scene);
  const novas = [];

  for (const vizinho of vizinhos(offset, tipo)) {
    const chave = chaveHex(vizinho);
    const atual = hexes[chave] ?? { ...HEX_PADRAO };
    if (atual.revelado) continue;
    hexes[chave] = { ...atual, revelado: true };
    novas.push(chave);
  }

  if (novas.length > 0) await scene.setFlag(MODULO, FLAG_HEXES, hexes);
  return novas;
}
```

- [ ] **Step 4: Implementar `scripts/dados/estado.js`**

```js
import { MODULO } from "./hexes.js";

const FLAG_ESTADO = "estado";

export const ESTADO_PADRAO = Object.freeze({
  dia: 1,
  tokenGrupoId: null,
  hexAtual: null,
  descansosCurtos: 0
});

/** @returns {{dia: number, tokenGrupoId: string|null, hexAtual: string|null, descansosCurtos: number}} */
export function lerEstado(scene) {
  return { ...ESTADO_PADRAO, ...(scene?.getFlag(MODULO, FLAG_ESTADO) ?? {}) };
}

/** Mescla um patch no estado. Só o Mestre deve chamar. */
export async function gravarEstado(scene, patch) {
  await scene.setFlag(MODULO, FLAG_ESTADO, { ...lerEstado(scene), ...patch });
}
```

- [ ] **Step 5: Rodar os testes e confirmar que passam**

Run: `npm test`
Expected: PASS — 57 testes no total.

- [ ] **Step 6: Commit**

```bash
git add scripts/dados/ tests/dados/
git commit -m "Adiciona a camada de dados das flags da Scene"
```

---

## Task 7: Camada de canvas e ferramenta de pintar

**Files:**
- Create: `scripts/canvas/camada-hex.js`, `scripts/canvas/ferramenta-pintar.js`
- Modify: `lang/pt-BR.json`

**Interfaces:**
- Consumes: `lerHexes`, `lerHex`, `gravarHex`, `tipoHexDaGrade`, `MODULO` de `dados/hexes.js`; `chaveHex`, `offsetDaChave` de `regras/vizinhos-hex.js`.
- Produces:
  - `class CamadaJornada extends foundry.canvas.layers.InteractionLayer` — com `static prepareSceneControls()` e `redesenhar()`
  - `abrirDialogoPintar(scene, offset) -> Promise<void>` de `ferramenta-pintar.js`

**API verificada no Foundry v14 instalado:** camadas ficam em `foundry.canvas.layers.*` e são registradas em `CONFIG.Canvas.layers.<chave>.layerClass`; os controles de cena vêm de um `static prepareSceneControls()` que devolve `{ tools: { <nome>: { name, order, title, icon } } }`. **Não verificável localmente:** `canvas.grid.getOffset`, `getCenterPoint` e `getVertices`. Se `getVertices` não existir no v14, desenhar o hexágono a partir de `getCenterPoint` mais o tamanho da grade; anotar o que foi usado em `docs/verificacao-manual.md`.

- [ ] **Step 1: Implementar `scripts/canvas/camada-hex.js`**

```js
import { lerHexes, tipoHexDaGrade } from "../dados/hexes.js";
import { offsetDaChave } from "../regras/vizinhos-hex.js";

const COR_NEVOA = 0x0b0e14;
const ALPHA_NEVOA_JOGADOR = 1.0;
const ALPHA_NEVOA_MESTRE = 0.55;
const COR_CORROMPIDO = 0x3a2a4d;
const COR_SANTUARIO = 0xe3c46a;

/**
 * Camada própria do módulo: desenha a névoa dos hexes não revelados e as
 * marcas de terreno, corrompido e santuário.
 *
 * A fog of war nativa não serve aqui porque deriva de visão e iluminação,
 * e não distingue "o grupo já esteve aqui" de "o grupo enxerga daqui".
 */
export class CamadaJornada extends foundry.canvas.layers.InteractionLayer {
  #grafico = null;

  static get layerOptions() {
    return foundry.utils.mergeObject(super.layerOptions, {
      name: "jornada",
      zIndex: 260
    });
  }

  static prepareSceneControls() {
    return {
      name: "jornada",
      order: 90,
      title: "JORNADA.controles.titulo",
      layer: "jornada",
      icon: "fa-solid fa-hexagon",
      activeTool: "pintar",
      tools: {
        pintar: {
          name: "pintar",
          order: 1,
          title: "JORNADA.controles.pintar",
          icon: "fa-solid fa-paintbrush"
        },
        definirGrupo: {
          name: "definirGrupo",
          order: 2,
          title: "JORNADA.controles.definirGrupo",
          icon: "fa-solid fa-people-group",
          button: true
        },
        painel: {
          name: "painel",
          order: 3,
          title: "JORNADA.controles.painel",
          icon: "fa-solid fa-scroll",
          button: true
        }
      }
    };
  }

  async _draw(options) {
    await super._draw(options);
    this.#grafico = this.addChild(new PIXI.Graphics());
    this.redesenhar();
  }

  /** Redesenha a névoa e as marcas a partir da flag da Scene. */
  redesenhar() {
    if (!this.#grafico) return;
    this.#grafico.clear();

    const scene = canvas.scene;
    if (!scene) return;
    if (!tipoHexDaGrade(scene.grid?.type)) return;

    const hexes = lerHexes(scene);
    const alphaNevoa = game.user.isGM ? ALPHA_NEVOA_MESTRE : ALPHA_NEVOA_JOGADOR;

    for (const [chave, hex] of Object.entries(hexes)) {
      const poligono = this.#poligonoDoHex(offsetDaChave(chave));
      if (!poligono) continue;

      if (!hex.revelado) {
        this.#grafico.beginFill(COR_NEVOA, alphaNevoa).drawPolygon(poligono).endFill();
        continue;
      }

      if (hex.corrompido) {
        this.#grafico.beginFill(COR_CORROMPIDO, 0.35).drawPolygon(poligono).endFill();
      }
      if (hex.santuario) {
        this.#grafico.lineStyle(4, COR_SANTUARIO, 0.9).drawPolygon(poligono).lineStyle(0);
      }
    }
  }

  /** @returns {number[]|null} vértices achatados [x0,y0,x1,y1,...] */
  #poligonoDoHex(offset) {
    const grid = canvas.grid;
    if (typeof grid.getVertices === "function") {
      const vertices = grid.getVertices(offset);
      return vertices.flatMap((v) => [v.x, v.y]);
    }
    // Reserva: hexágono regular em torno do centro da célula.
    const centro = grid.getCenterPoint(offset);
    const raio = grid.size / 2;
    const giro = canvas.grid.columns ? 0 : Math.PI / 6;
    const pontos = [];
    for (let k = 0; k < 6; k++) {
      const angulo = giro + (k * Math.PI) / 3;
      pontos.push(centro.x + raio * Math.cos(angulo), centro.y + raio * Math.sin(angulo));
    }
    return pontos;
  }
}
```

- [ ] **Step 2: Implementar `scripts/canvas/ferramenta-pintar.js`**

```js
import { gravarHex, lerHex } from "../dados/hexes.js";
import { TERRENO } from "../regras/custo-viagem.js";

const HABITATS = [
  "floresta", "montanha", "pantano", "campina",
  "deserto", "gelo", "aquatico", "ruinas"
];

/**
 * Diálogo de pintar hex: habitat, terreno, corrompido e santuário.
 * @param {Scene} scene
 * @param {{i: number, j: number}} offset
 */
export async function abrirDialogoPintar(scene, offset) {
  const atual = lerHex(scene, offset);

  const opcoesHabitat = HABITATS.map(
    (h) =>
      `<option value="${h}" ${atual.habitat === h ? "selected" : ""}>${game.i18n.localize(
        `JORNADA.habitat.${h}`
      )}</option>`
  ).join("");

  const opcoesTerreno = Object.values(TERRENO)
    .map(
      (t) =>
        `<option value="${t}" ${atual.terreno === t ? "selected" : ""}>${game.i18n.localize(
          `JORNADA.terreno.${t}`
        )}</option>`
    )
    .join("");

  const conteudo = `
    <form class="jornada-pintar">
      <div class="form-group">
        <label>${game.i18n.localize("JORNADA.pintar.habitat")}</label>
        <select name="habitat">${opcoesHabitat}</select>
      </div>
      <div class="form-group">
        <label>${game.i18n.localize("JORNADA.pintar.terreno")}</label>
        <select name="terreno">${opcoesTerreno}</select>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" name="corrompido" ${atual.corrompido ? "checked" : ""}>
          ${game.i18n.localize("JORNADA.pintar.corrompido")}
        </label>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" name="santuario" ${atual.santuario ? "checked" : ""}>
          ${game.i18n.localize("JORNADA.pintar.santuario")}
        </label>
      </div>
    </form>`;

  const dados = await foundry.applications.api.DialogV2.prompt({
    window: { title: game.i18n.localize("JORNADA.pintar.titulo") },
    content: conteudo,
    ok: {
      label: game.i18n.localize("JORNADA.pintar.salvar"),
      callback: (_evento, botao) => {
        const form = botao.form;
        return {
          habitat: form.habitat.value,
          terreno: Number(form.terreno.value),
          corrompido: form.corrompido.checked,
          santuario: form.santuario.checked
        };
      }
    },
    rejectClose: false
  });

  if (!dados) return;
  await gravarHex(scene, offset, dados);
}
```

- [ ] **Step 3: Acrescentar as strings em `lang/pt-BR.json`**

Dentro de `"JORNADA"`:

```json
    "controles": {
      "titulo": "Jornada",
      "pintar": "Pintar hex",
      "definirGrupo": "Definir token do grupo",
      "painel": "Abrir painel da jornada"
    },
    "habitat": {
      "floresta": "Floresta",
      "montanha": "Montanha",
      "pantano": "Pântano",
      "campina": "Campina",
      "deserto": "Deserto",
      "gelo": "Gelo",
      "aquatico": "Aquático",
      "ruinas": "Ruínas"
    },
    "pintar": {
      "titulo": "Pintar hex",
      "habitat": "Habitat",
      "terreno": "Terreno",
      "corrompido": "Corrompido pela mácula",
      "santuario": "Santuário",
      "salvar": "Salvar"
    }
```

- [ ] **Step 4: Rodar os testes**

Run: `npm test`
Expected: PASS — 57 testes, inalterados. Esta task não altera regra pura.

- [ ] **Step 5: Commit**

```bash
git add scripts/canvas/ lang/pt-BR.json
git commit -m "Adiciona a camada de canvas e a ferramenta de pintar hex"
```

---

## Task 8: Fluxo de viagem e card de encontro

**Files:**
- Create: `scripts/fluxo/viagem.js`, `scripts/fluxo/encontro.js`
- Modify: `lang/pt-BR.json`

**Interfaces:**
- Consumes: `diasDeViagem` de `regras/custo-viagem.js`; `quantidadeDeDados`, `avaliarEncontro` de `regras/dados-encontro.js`; `saoAdjacentes`, `chaveHex`, `offsetDaChave` de `regras/vizinhos-hex.js`; `lerHex`, `gravarHex`, `revelarVizinhos`, `tipoHexDaGrade` de `dados/hexes.js`; `lerEstado`, `gravarEstado` de `dados/estado.js`; `abrirDialogoPintar` de `canvas/ferramenta-pintar.js`.
- Produces:
  - `registrarHooksDeViagem()` de `viagem.js`
  - `rolarEncontro(scene, offset) -> Promise<void>` e `registrarBotaoDeMedo()` de `encontro.js`

**Regra central:** o movimento é interceptado em `preUpdateToken` e **cancelado** (`return false`) até que o Mestre confirme. Um arrastar acidental não pode consumir dias de campanha.

- [ ] **Step 1: Implementar `scripts/fluxo/encontro.js`**

```js
import { MODULO, lerHex } from "../dados/hexes.js";
import { quantidadeDeDados, avaliarEncontro } from "../regras/dados-encontro.js";

/**
 * Rola os Dados de Encontro do hex e publica o card no chat.
 * @param {Scene} scene
 * @param {{i: number, j: number}} offset
 */
export async function rolarEncontro(scene, offset) {
  const hex = lerHex(scene, offset);
  const quantidade = quantidadeDeDados(hex.terreno);

  const rolagem = await new Roll(`${quantidade}d6`).evaluate();
  const resultados = rolagem.dice[0].results.map((r) => r.result);
  const { disparou } = avaliarEncontro(resultados);

  const dados = resultados
    .map((v) => `<span class="jornada-dado ${v === 1 ? "acerto" : ""}">${v}</span>`)
    .join("");

  const veredito = disparou
    ? `<p class="jornada-disparou">${game.i18n.localize("JORNADA.encontro.disparou")}</p>`
    : `<p class="jornada-calmo">${game.i18n.localize("JORNADA.encontro.semEncontro")}</p>
       <button type="button" data-acao="gastar-medo">
         ${game.i18n.localize("JORNADA.encontro.gastarMedo")}
       </button>`;

  await ChatMessage.create({
    speaker: { alias: game.i18n.localize("JORNADA.encontro.remetente") },
    content: `
      <div class="jornada-encontro" data-modulo="${MODULO}">
        <h4>${game.i18n.format("JORNADA.encontro.titulo", { quantidade })}</h4>
        <div class="jornada-dados">${dados}</div>
        ${veredito}
      </div>`,
    rolls: [rolagem],
    whisper: disparou ? [] : ChatMessage.getWhisperRecipients("GM").map((u) => u.id)
  });
}

/** Liga o botão "gastar 1 Medo" dos cards já publicados. */
export function registrarBotaoDeMedo() {
  Hooks.on("renderChatMessageHTML", (_mensagem, elemento) => {
    const botao = elemento.querySelector('[data-acao="gastar-medo"]');
    if (!botao) return;
    if (!game.user.isGM) {
      botao.remove();
      return;
    }
    botao.addEventListener("click", async () => {
      botao.disabled = true;
      await ChatMessage.create({
        speaker: { alias: game.i18n.localize("JORNADA.encontro.remetente") },
        content: `<p class="jornada-disparou">${game.i18n.localize(
          "JORNADA.encontro.forcadoPorMedo"
        )}</p>`
      });
    });
  });
}
```

- [ ] **Step 2: Implementar `scripts/fluxo/viagem.js`**

```js
import { abrirDialogoPintar } from "../canvas/ferramenta-pintar.js";
import { lerHex, revelarVizinhos, tipoHexDaGrade } from "../dados/hexes.js";
import { lerEstado, gravarEstado } from "../dados/estado.js";
import { diasDeViagem } from "../regras/custo-viagem.js";
import { chaveHex, offsetDaChave, saoAdjacentes } from "../regras/vizinhos-hex.js";
import { rolarEncontro } from "./encontro.js";

/** Movimento em curso já aprovado, para não reentrar no hook. */
let movimentoAprovado = null;

export function registrarHooksDeViagem() {
  Hooks.on("preUpdateToken", (documento, mudancas) => {
    const scene = documento.parent;
    const tipo = tipoHexDaGrade(scene?.grid?.type);
    if (!tipo) return true;

    const estado = lerEstado(scene);
    if (documento.id !== estado.tokenGrupoId) return true;
    if (mudancas.x === undefined && mudancas.y === undefined) return true;

    if (movimentoAprovado === documento.id) {
      movimentoAprovado = null;
      return true;
    }

    if (!game.user.isGM) {
      ui.notifications.warn(game.i18n.localize("JORNADA.viagem.somenteMestre"));
      return false;
    }

    const destino = canvas.grid.getOffset({
      x: mudancas.x ?? documento.x,
      y: mudancas.y ?? documento.y
    });

    // Cancela o movimento e conduz a confirmação em separado.
    confirmarViagem(scene, documento, destino, tipo);
    return false;
  });
}

/**
 * Confirma o custo, aplica o movimento, revela vizinhos e rola o encontro.
 */
async function confirmarViagem(scene, documento, destino, tipo) {
  const estado = lerEstado(scene);
  const origem = estado.hexAtual ? offsetDaChave(estado.hexAtual) : null;

  if (origem && !saoAdjacentes(origem, destino, tipo)) {
    const reposicionar = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("JORNADA.viagem.naoAdjacenteTitulo") },
      content: `<p>${game.i18n.localize("JORNADA.viagem.naoAdjacente")}</p>`,
      rejectClose: false
    });
    if (!reposicionar) return;
    await aplicarMovimento(scene, documento, destino, { cobrarDias: false });
    return;
  }

  let hex = lerHex(scene, destino);
  if (!hex.habitat) {
    await abrirDialogoPintar(scene, destino);
    hex = lerHex(scene, destino);
  }

  const dias = diasDeViagem(hex.terreno);
  const confirmado = await foundry.applications.api.DialogV2.confirm({
    window: { title: game.i18n.localize("JORNADA.viagem.confirmarTitulo") },
    content: `<p>${game.i18n.format("JORNADA.viagem.confirmar", {
      habitat: game.i18n.localize(`JORNADA.habitat.${hex.habitat}`),
      terreno: game.i18n.localize(`JORNADA.terreno.${hex.terreno}`),
      dias
    })}</p>`,
    rejectClose: false
  });
  if (!confirmado) return;

  await aplicarMovimento(scene, documento, destino, { cobrarDias: true, dias });
  await revelarVizinhos(scene, destino);
  await rolarEncontro(scene, destino);
}

async function aplicarMovimento(scene, documento, destino, { cobrarDias, dias = 0 }) {
  const estado = lerEstado(scene);
  const centro = canvas.grid.getCenterPoint(destino);
  const canto = canvas.grid.getTopLeftPoint(destino);

  movimentoAprovado = documento.id;
  await documento.update({ x: canto?.x ?? centro.x, y: canto?.y ?? centro.y });

  await gravarEstado(scene, {
    hexAtual: chaveHex(destino),
    dia: cobrarDias ? estado.dia + dias : estado.dia
  });
}
```

- [ ] **Step 3: Acrescentar as strings em `lang/pt-BR.json`**

Dentro de `"JORNADA"`:

```json
    "viagem": {
      "somenteMestre": "Só o Mestre move o token do grupo.",
      "confirmarTitulo": "Confirmar viagem",
      "confirmar": "Entrar em {habitat} — terreno {terreno}, {dias} dia(s) de viagem. Confirmar?",
      "naoAdjacenteTitulo": "Hex não adjacente",
      "naoAdjacente": "Esse hex não faz fronteira com o hex atual do grupo. Reposicionar sem cobrar dias de viagem?"
    },
    "encontro": {
      "remetente": "Jornada",
      "titulo": "Dados de Encontro ({quantidade}d6)",
      "disparou": "Encontro disparado.",
      "semEncontro": "Nenhum encontro.",
      "gastarMedo": "Gastar 1 Medo para forçar um encontro",
      "forcadoPorMedo": "O Mestre gastou 1 Medo: encontro forçado."
    }
```

- [ ] **Step 4: Rodar os testes**

Run: `npm test`
Expected: PASS — 57 testes, inalterados.

- [ ] **Step 5: Commit**

```bash
git add scripts/fluxo/ lang/pt-BR.json
git commit -m "Adiciona o fluxo de viagem e o card dos Dados de Encontro"
```

---

## Task 9: Painel da jornada

**Files:**
- Create: `scripts/ui/painel-jornada.js`, `styles/jornada.css`
- Modify: `lang/pt-BR.json`

**Interfaces:**
- Consumes: `lerEstado`, `gravarEstado` de `dados/estado.js`; `lerHex` de `dados/hexes.js`; `podeDescansoCurto`, `podeDescansoLongo`, `aplicarDescansoCurto`, `aplicarDescansoLongo`, `MAX_CURTOS_SEGUIDOS` de `regras/descansos.js`; `ESTRUTURA_PERDICAO`, `caixasDisponiveis`, `marcarCaixa` de `regras/perdicao.js`; `offsetDaChave` de `regras/vizinhos-hex.js`.
- Produces: `class PainelJornada extends foundry.applications.api.ApplicationV2` com `static abrir()`.

**Settings de mundo registrados aqui** (consumidos pela Task 10):
- `perdicaoMarcadas` — `Array`, default `[]`
- `perdicaoTextos` — `Object`, default `{}` (id da caixa → texto escrito pelo Mestre)
- `tierManual` — `Number`, default `0` (0 = derivar do maior nível dos PJs)

- [ ] **Step 1: Implementar `scripts/ui/painel-jornada.js`**

```js
import { MODULO, lerHex } from "../dados/hexes.js";
import { lerEstado, gravarEstado } from "../dados/estado.js";
import {
  MAX_CURTOS_SEGUIDOS,
  podeDescansoCurto,
  podeDescansoLongo,
  aplicarDescansoCurto,
  aplicarDescansoLongo
} from "../regras/descansos.js";
import { ESTRUTURA_PERDICAO, caixasDisponiveis, marcarCaixa } from "../regras/perdicao.js";
import { offsetDaChave } from "../regras/vizinhos-hex.js";

/** Tier do Daggerheart a partir do nível: 1, 2-4, 5-7, 8-10. */
function tierDoNivel(nivel) {
  if (nivel >= 8) return 4;
  if (nivel >= 5) return 3;
  if (nivel >= 2) return 2;
  return 1;
}

/** Maior tier entre os personagens de jogador, ou a sobrescrita manual. */
export function tierDoGrupo() {
  const manual = game.settings.get(MODULO, "tierManual");
  if (manual > 0) return manual;

  const niveis = game.actors
    .filter((a) => a.hasPlayerOwner && a.type === "character")
    .map((a) => Number(a.system?.levelData?.level?.current ?? a.system?.level ?? 1));

  return niveis.length > 0 ? tierDoNivel(Math.max(...niveis)) : 1;
}

export class PainelJornada extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "jornada-painel",
    tag: "div",
    window: { title: "JORNADA.painel.titulo", icon: "fa-solid fa-scroll" },
    position: { width: 340, height: "auto" },
    actions: {
      descansoCurto: PainelJornada.#descansoCurto,
      descansoLongo: PainelJornada.#descansoLongo,
      fimDeSessao: PainelJornada.#fimDeSessao
    }
  };

  static abrir() {
    new PainelJornada().render({ force: true });
  }

  #contexto() {
    const scene = canvas.scene;
    const estado = lerEstado(scene);
    const hex = estado.hexAtual ? lerHex(scene, offsetDaChave(estado.hexAtual)) : null;
    const emSantuario = hex?.santuario === true;
    const situacao = { descansosCurtos: estado.descansosCurtos, emSantuario };

    return {
      estado,
      emSantuario,
      curto: podeDescansoCurto(situacao),
      longo: podeDescansoLongo(situacao),
      marcadas: game.settings.get(MODULO, "perdicaoMarcadas"),
      textos: game.settings.get(MODULO, "perdicaoTextos"),
      tier: tierDoGrupo(),
      semTokenGrupo: !estado.tokenGrupoId
    };
  }

  async _renderHTML() {
    const c = this.#contexto();
    const t = (chave, dados) => game.i18n.format(chave, dados ?? {});

    const aviso = c.semTokenGrupo
      ? `<p class="jornada-aviso">${t("JORNADA.painel.semTokenGrupo")}</p>`
      : "";

    const caixas = ESTRUTURA_PERDICAO.map((caixa) => {
      const marcada = c.marcadas.includes(caixa.id);
      const texto = c.textos[caixa.id] ?? "";
      return `<li class="${marcada ? "marcada" : ""}" data-tier="${caixa.tier}">
        <span class="jornada-caixa">${marcada ? "■" : "□"}</span>
        <span class="jornada-evento">${foundry.utils.escapeHTML(texto)}</span>
      </li>`;
    }).join("");

    const html = document.createElement("div");
    html.className = "jornada-painel";
    html.innerHTML = `
      ${aviso}
      <p class="jornada-dia">${t("JORNADA.painel.dia", { dia: c.estado.dia })}</p>
      <p class="jornada-descansos">${t("JORNADA.painel.descansos", {
        usados: c.estado.descansosCurtos,
        maximo: MAX_CURTOS_SEGUIDOS
      })}</p>
      <div class="jornada-botoes">
        <button type="button" data-action="descansoCurto" ${c.curto.permitido ? "" : "disabled"}
                title="${c.curto.motivo ? t(c.curto.motivo) : ""}">
          ${t("JORNADA.painel.descansoCurto")}
        </button>
        <button type="button" data-action="descansoLongo" ${c.longo.permitido ? "" : "disabled"}
                title="${c.longo.motivo ? t(c.longo.motivo) : ""}">
          ${t("JORNADA.painel.descansoLongo")}
        </button>
      </div>
      <h4>${t("JORNADA.painel.perdicao", { tier: c.tier })}</h4>
      <ul class="jornada-perdicao">${caixas}</ul>
      ${
        game.user.isGM
          ? `<button type="button" data-action="fimDeSessao">${t(
              "JORNADA.painel.fimDeSessao"
            )}</button>`
          : ""
      }`;
    return html;
  }

  _replaceHTML(resultado, elemento) {
    elemento.replaceChildren(resultado);
  }

  static async #descansoCurto() {
    const scene = canvas.scene;
    await gravarEstado(scene, aplicarDescansoCurto(lerEstado(scene)));
    this.render();
  }

  static async #descansoLongo() {
    const scene = canvas.scene;
    await gravarEstado(scene, aplicarDescansoLongo(lerEstado(scene)));
    this.render();
  }

  static async #fimDeSessao() {
    const marcadas = game.settings.get(MODULO, "perdicaoMarcadas");
    const disponiveis = caixasDisponiveis(marcadas, tierDoGrupo());

    if (disponiveis.length === 0) {
      ui.notifications.info(game.i18n.localize("JORNADA.painel.semCaixas"));
      return;
    }

    const id = disponiveis[0];
    const textos = game.settings.get(MODULO, "perdicaoTextos");

    const texto = await foundry.applications.api.DialogV2.prompt({
      window: { title: game.i18n.localize("JORNADA.painel.marcarTitulo") },
      content: `<form><div class="form-group">
          <label>${game.i18n.localize("JORNADA.painel.textoEvento")}</label>
          <input type="text" name="texto" value="${textos[id] ?? ""}">
        </div></form>`,
      ok: {
        label: game.i18n.localize("JORNADA.painel.marcar"),
        callback: (_e, botao) => botao.form.texto.value
      },
      rejectClose: false
    });
    if (texto === null || texto === undefined) return;

    await game.settings.set(MODULO, "perdicaoMarcadas", marcarCaixa(marcadas, id));
    await game.settings.set(MODULO, "perdicaoTextos", { ...textos, [id]: texto });
    this.render();
  }
}
```

- [ ] **Step 2: Criar `styles/jornada.css`**

```css
.jornada-painel { padding: 0.5rem 0.75rem; font-size: 0.95rem; }
.jornada-painel .jornada-aviso { color: #b35; font-weight: 600; }
.jornada-painel .jornada-dia { font-size: 1.2rem; font-weight: 700; margin: 0.25rem 0; }
.jornada-painel .jornada-botoes { display: flex; gap: 0.5rem; margin: 0.5rem 0; }
.jornada-painel .jornada-botoes button { flex: 1; }
.jornada-painel .jornada-perdicao { list-style: none; margin: 0; padding: 0; }
.jornada-painel .jornada-perdicao li { display: flex; gap: 0.5rem; padding: 0.15rem 0; }
.jornada-painel .jornada-perdicao li.marcada .jornada-evento { opacity: 0.7; }
.jornada-painel .jornada-caixa { width: 1rem; }

.jornada-encontro .jornada-dados { display: flex; gap: 0.35rem; margin: 0.4rem 0; }
.jornada-encontro .jornada-dado {
  display: inline-block; min-width: 1.6rem; text-align: center;
  padding: 0.15rem 0.3rem; border: 1px solid #8884; border-radius: 4px;
}
.jornada-encontro .jornada-dado.acerto { border-color: #c33; color: #c33; font-weight: 700; }
.jornada-encontro .jornada-disparou { color: #c33; font-weight: 700; }
```

- [ ] **Step 3: Acrescentar as strings em `lang/pt-BR.json`**

Dentro de `"JORNADA"`:

```json
    "painel": {
      "titulo": "Jornada",
      "dia": "Dia {dia}",
      "descansos": "Descansos curtos: {usados}/{maximo}",
      "descansoCurto": "Descanso curto",
      "descansoLongo": "Descanso longo",
      "perdicao": "Trilha da Perdição (grupo no tier {tier})",
      "fimDeSessao": "Fim de sessão: marcar a Perdição",
      "marcarTitulo": "Marcar caixa da Perdição",
      "textoEvento": "O que acontece em Valloren?",
      "marcar": "Marcar",
      "semCaixas": "Não há caixa disponível para marcar no tier atual.",
      "semTokenGrupo": "Nenhum token do grupo definido nesta cena."
    }
```

- [ ] **Step 4: Rodar os testes**

Run: `npm test`
Expected: PASS — 57 testes, inalterados.

- [ ] **Step 5: Commit**

```bash
git add scripts/ui/ styles/ lang/pt-BR.json
git commit -m "Adiciona o painel da jornada com descansos e Trilha da Perdicao"
```

---

## Task 10: Amarração, settings e roteiro de verificação

**Files:**
- Create: `scripts/main.js`, `docs/verificacao-manual.md`, `README.md`
- Modify: `lang/pt-BR.json`

**Interfaces:**
- Consumes: tudo das tasks anteriores.
- Produces: o módulo carregável.

- [ ] **Step 1: Implementar `scripts/main.js`**

```js
import { CamadaJornada } from "./canvas/camada-hex.js";
import { abrirDialogoPintar } from "./canvas/ferramenta-pintar.js";
import { MODULO, tipoHexDaGrade } from "./dados/hexes.js";
import { gravarEstado } from "./dados/estado.js";
import { registrarBotaoDeMedo } from "./fluxo/encontro.js";
import { registrarHooksDeViagem } from "./fluxo/viagem.js";
import { chaveHex } from "./regras/vizinhos-hex.js";
import { PainelJornada } from "./ui/painel-jornada.js";

Hooks.once("init", () => {
  // Chave própria: o sistema Daggerheart já substitui `regions` e `tokens`.
  CONFIG.Canvas.layers.jornada = { layerClass: CamadaJornada, group: "interface" };

  game.settings.register(MODULO, "perdicaoMarcadas", {
    scope: "world", config: false, type: Array, default: []
  });
  game.settings.register(MODULO, "perdicaoTextos", {
    scope: "world", config: false, type: Object, default: {}
  });
  game.settings.register(MODULO, "tierManual", {
    name: "JORNADA.settings.tierManual.nome",
    hint: "JORNADA.settings.tierManual.dica",
    scope: "world", config: true, type: Number, default: 0,
    choices: { 0: "JORNADA.settings.tierManual.automatico", 1: "1", 2: "2", 3: "3", 4: "4" }
  });

  registrarHooksDeViagem();
  registrarBotaoDeMedo();
});

Hooks.once("ready", () => {
  if (!canvas.scene) return;
  if (!tipoHexDaGrade(canvas.scene.grid?.type)) {
    ui.notifications.info(game.i18n.localize("JORNADA.avisos.gradeNaoHexagonal"));
  }
});

// Redesenha a névoa quando o Mestre altera o mapa.
Hooks.on("updateScene", (scene) => {
  if (scene.id !== canvas.scene?.id) return;
  canvas.jornada?.redesenhar();
});

// Clique no canvas com a ferramenta de pintar ativa.
Hooks.on("canvasReady", () => {
  canvas.stage.off("pointerdown", aoClicarNoCanvas);
  canvas.stage.on("pointerdown", aoClicarNoCanvas);
});

async function aoClicarNoCanvas(evento) {
  if (!game.user.isGM) return;
  if (canvas.activeLayer !== canvas.jornada) return;
  if (game.activeTool !== "pintar") return;

  const ponto = evento.data.getLocalPosition(canvas.stage);
  const offset = canvas.grid.getOffset(ponto);
  await abrirDialogoPintar(canvas.scene, offset);
}

// Botões de ação dos controles de cena.
Hooks.on("renderSceneControls", (_app, elemento) => {
  elemento.querySelector('[data-tool="painel"]')
    ?.addEventListener("click", () => PainelJornada.abrir());
  elemento.querySelector('[data-tool="definirGrupo"]')
    ?.addEventListener("click", definirTokenDoGrupo);
});

async function definirTokenDoGrupo() {
  const selecionado = canvas.tokens.controlled[0];
  if (!selecionado) {
    ui.notifications.warn(game.i18n.localize("JORNADA.avisos.selecioneUmToken"));
    return;
  }
  const offset = canvas.grid.getOffset({ x: selecionado.document.x, y: selecionado.document.y });
  await gravarEstado(canvas.scene, {
    tokenGrupoId: selecionado.document.id,
    hexAtual: chaveHex(offset)
  });
  ui.notifications.info(
    game.i18n.format("JORNADA.avisos.grupoDefinido", { nome: selecionado.document.name })
  );
}
```

- [ ] **Step 2: Acrescentar as strings finais em `lang/pt-BR.json`**

Dentro de `"JORNADA"`:

```json
    "avisos": {
      "gradeNaoHexagonal": "Esta cena não usa grade hexagonal. As ferramentas de jornada ficam inativas aqui.",
      "selecioneUmToken": "Selecione o token que representa o grupo antes de usar este botão.",
      "grupoDefinido": "{nome} agora é o token do grupo nesta cena."
    },
    "settings": {
      "tierManual": {
        "nome": "Tier do grupo",
        "dica": "Deixe em automático para derivar do maior nível entre os personagens dos jogadores.",
        "automatico": "Automático"
      }
    }
```

- [ ] **Step 3: Criar `docs/verificacao-manual.md`**

```markdown
# Roteiro de verificação manual

Executar antes de cada release, num mundo de teste com o sistema Daggerheart.

## Preparação
- [ ] Criar uma Scene com grade hexagonal (qualquer um dos quatro layouts).
- [ ] Ativar o módulo. Confirmar que a aba "Jornada" aparece nos controles de cena.
- [ ] Abrir uma Scene com grade quadrada: confirmar o aviso e que nada quebra.

## Pintar
- [ ] Com a ferramenta "Pintar hex", clicar num hex e preencher habitat e terreno.
- [ ] Reabrir o mesmo hex: os valores salvos aparecem preenchidos.
- [ ] Marcar um hex como santuário: a borda dourada aparece.
- [ ] Marcar um hex como corrompido: o tom arroxeado aparece.

## Viagem
- [ ] Definir o token do grupo com o botão dos controles.
- [ ] Arrastar o token para um hex adjacente: o diálogo de confirmação aparece
      com o habitat, o terreno e os dias corretos.
- [ ] Cancelar o diálogo: o token volta para onde estava e o dia não muda.
- [ ] Confirmar: o dia avança conforme o terreno.
- [ ] Arrastar para um hex nunca pintado: o diálogo de pintar abre primeiro.
- [ ] Arrastar para um hex distante: a oferta de reposicionar sem custo aparece,
      e aceitar não cobra dias.

## Névoa
- [ ] Entrar num hex e confirmar que os seis vizinhos foram revelados.
- [ ] Abrir uma sessão como jogador: os hexes não revelados aparecem opacos.
- [ ] Como Mestre, os mesmos hexes aparecem translúcidos.
- [ ] Como jogador, tentar mover o token do grupo: o movimento é recusado.

## Encontro
- [ ] Viajar por um hex de terreno 4: o card mostra 4d6.
- [ ] Com um 1 na rolagem: o card anuncia o encontro, visível a todos.
- [ ] Sem nenhum 1: o card é sussurrado ao Mestre, com o botão de Medo.
- [ ] Clicar no botão de Medo: a mensagem de encontro forçado é publicada.

## Painel
- [ ] Abrir o painel pelo botão dos controles.
- [ ] Fazer três descansos curtos fora de santuário: o quarto fica desabilitado
      com a explicação no tooltip.
- [ ] Fora de santuário, o descanso longo está desabilitado.
- [ ] Dentro de santuário, o descanso longo funciona e zera o contador de curtos.
- [ ] "Fim de sessão" oferece a primeira caixa não marcada do tier e aceita o texto.
- [ ] Trocar de Scene: a Trilha da Perdição continua marcada.

## Anotações de API
Registrar aqui qualquer método do Foundry que tenha se comportado de forma
diferente do previsto no plano — em especial `canvas.grid.getOffset`,
`getCenterPoint`, `getTopLeftPoint` e `getVertices`.
```

- [ ] **Step 4: Criar `README.md`**

```markdown
# Daggerheart - Jornada por Valloren

Ferramenta de viagem por hexágonos para o sistema Daggerheart no Foundry VTT.

- Viagem hex a hex com custo em dias conforme o terreno
- Revelação progressiva do mapa dos jogadores
- Dados de Encontro automáticos, com a opção de forçar gastando 1 Medo
- Controle de descansos curtos e da exigência de santuário para o longo
- Trilha da Perdição da campanha, com eventos escritos pelo Mestre

## Instalação

Manifesto:
`https://github.com/giovannialopes/daggerheart-jornada-valloren/releases/latest/download/module.json`

## Uso

1. Crie uma Scene com grade hexagonal.
2. Na aba **Jornada** dos controles de cena, pinte os hexes com habitat e terreno.
3. Selecione o token do grupo e use **Definir token do grupo**.
4. Arraste o token para viajar.

## Aviso

Conteúdo não oficial. Ferramenta de mesa feita por fã, sem afiliação com a
Darrington Press ou a Jambô Editora. As tabelas e textos incluídos são autorais;
nenhum conteúdo dos livros é reproduzido.

## Desenvolvimento

```bash
npm install
npm test
```
```

- [ ] **Step 5: Rodar os testes**

Run: `npm test`
Expected: PASS — 57 testes.

- [ ] **Step 6: Executar o roteiro manual**

Copiar a pasta do módulo (ou criar um link simbólico) para
`%LOCALAPPDATA%/FoundryVTT/Data/modules/daggerheart-jornada-valloren` e
percorrer `docs/verificacao-manual.md`, anotando os desvios de API na seção
final do roteiro.

- [ ] **Step 7: Commit**

```bash
git add scripts/main.js docs/verificacao-manual.md README.md lang/pt-BR.json
git commit -m "Amarra o modulo: settings, hooks e roteiro de verificacao"
```

---

## Notas de risco

O app do Foundry não está instalado nesta máquina — só o diretório de dados —,
então a verificação foi feita lendo o sistema Daggerheart 2.9.3 e os módulos
instalados.

**Confirmado por leitura de código real:** `foundry.canvas.layers.*` (namespace),
`CONFIG.Canvas.layers.<chave>.layerClass`, `static prepareSceneControls()` com
`tools` como objeto, `foundry.applications.ui.SceneControls`,
`foundry.applications.api.ApplicationV2`, `DialogV2`, `foundry.utils.escapeHTML`,
o hook `renderChatMessageHTML`, `canvas.grid.isHexagonal`, `canvas.grid.type`,
`canvas.grid.getCenterPoint` e `canvas.grid.getTopLeftPoint`.

**Não confirmado — verificar na primeira execução:**
`foundry.canvas.layers.InteractionLayer` (só `RegionLayer` e `TokenLayer`
aparecem no código instalado; se a classe base não existir nesse caminho, usar
`foundry.canvas.layers.CanvasLayer`), `canvas.grid.getOffset` e
`canvas.grid.getVertices`.

A Task 7 já traz um caminho de reserva para `getVertices`. Se `getOffset` não
existir com essa assinatura, o ponto de correção é único: as três chamadas em
`fluxo/viagem.js` e `main.js`. A vizinhança hexagonal foi deliberadamente
implementada em código próprio e testado, justamente para não depender de
`getAdjacentOffsets`, que não aparece em nenhum código instalado.
