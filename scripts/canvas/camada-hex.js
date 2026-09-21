import { MODULO, lerHexes, tipoHexDaGrade } from "../dados/hexes.js";
import { chaveHex, offsetDaChave } from "../regras/vizinhos-hex.js";

const COR_NEVOA = 0x0b0e14;
const ALPHA_NEVOA_JOGADOR = 1.0;
const ALPHA_NEVOA_MESTRE = 0.55;
const COR_CORROMPIDO = 0x3a2a4d;
const COR_SANTUARIO = 0xe3c46a;

/** Teto de células desenhadas num redesenho, para uma cena absurdamente grande. */
const MAX_CELULAS = 40000;

/**
 * Ações dos botões de controle de cena. As tasks que implementam cada ação
 * preenchem estes campos no init; as ferramentas apenas disparam o que
 * estiver registrado.
 */
export const acoesDaJornada = {
  abrirPainel: null,
  definirGrupo: null
};

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
    // As ferramentas que escrevem nas flags são do Mestre; o jogador só vê o
    // painel, que é leitura. Sem isto o jogador clicaria e tomaria uma exceção
    // de permissão no `setFlag`.
    const mestre = game.user?.isGM === true;

    return {
      name: "jornada",
      order: 90,
      title: "JORNADA.controles.titulo",
      layer: "jornada",
      icon: "fa-solid fa-hexagon",
      visible: true,
      activeTool: mestre ? "pintar" : "painel",
      tools: {
        pintar: {
          name: "pintar",
          order: 1,
          title: "JORNADA.controles.pintar",
          icon: "fa-solid fa-paintbrush",
          visible: mestre
        },
        definirGrupo: {
          name: "definirGrupo",
          order: 2,
          title: "JORNADA.controles.definirGrupo",
          icon: "fa-solid fa-people-group",
          button: true,
          visible: mestre,
          onChange: () => acoesDaJornada.definirGrupo?.()
        },
        painel: {
          name: "painel",
          order: 3,
          title: "JORNADA.controles.painel",
          icon: "fa-solid fa-scroll",
          button: true,
          visible: true,
          onChange: () => acoesDaJornada.abrirPainel?.()
        }
      }
    };
  }

  async _draw(options) {
    await super._draw(options);
    this.#grafico = this.addChild(new PIXI.Graphics());
    this.redesenhar();
  }

  /**
   * Redesenha a névoa e as marcas.
   *
   * A névoa cobre toda célula da grade da cena que não esteja marcada como
   * revelada — inclusive as que nunca foram pintadas, que de outro modo
   * deixariam a arte do mapa à mostra para o jogador.
   */
  redesenhar() {
    if (!this.#grafico) return;
    this.#grafico.clear();

    const scene = canvas.scene;
    if (!scene) return;
    if (!tipoHexDaGrade(scene.grid?.type)) return;

    const hexes = lerHexes(scene);
    const alphaNevoa = game.user.isGM ? ALPHA_NEVOA_MESTRE : ALPHA_NEVOA_JOGADOR;

    // Todas as células de uma grade hexagonal são congruentes: basta calcular
    // o polígono uma vez e transladá-lo para o centro de cada célula.
    const molde = this.#moldeDoHex();
    if (!molde) return;

    this.#grafico.beginFill(COR_NEVOA, alphaNevoa);
    for (const offset of this.#celulasDaCena()) {
      if (hexes[chaveHex(offset)]?.revelado) continue;
      this.#grafico.drawPolygon(this.#poligonoEm(offset, molde));
    }
    this.#grafico.endFill();

    // As marcas só existem em hexes já pintados, então bastam as chaves da flag.
    for (const [chave, hex] of Object.entries(hexes)) {
      if (!hex.revelado) continue;
      if (!hex.corrompido && !hex.santuario) continue;

      const poligono = this.#poligonoEm(offsetDaChave(chave), molde);
      if (hex.corrompido) {
        this.#grafico.beginFill(COR_CORROMPIDO, 0.35).drawPolygon(poligono).endFill();
      }
      if (hex.santuario) {
        this.#grafico.lineStyle(4, COR_SANTUARIO, 0.9).drawPolygon(poligono).lineStyle(0);
      }
    }
  }

  /**
   * Percorre as células da grade contidas no retângulo da cena.
   * @returns {Generator<{i: number, j: number}>}
   */
  *#celulasDaCena() {
    const grid = canvas.grid;
    const rect = canvas.dimensions?.sceneRect ?? canvas.scene?.dimensions?.sceneRect;
    if (!rect) return;

    let i0;
    let j0;
    let i1;
    let j1;

    if (typeof grid.getOffsetRange === "function") {
      [i0, j0, i1, j1] = grid.getOffsetRange(rect);
    } else {
      // Reserva: os quatro cantos, com uma célula de folga em volta.
      const cantos = [
        grid.getOffset({ x: rect.x, y: rect.y }),
        grid.getOffset({ x: rect.x + rect.width, y: rect.y }),
        grid.getOffset({ x: rect.x, y: rect.y + rect.height }),
        grid.getOffset({ x: rect.x + rect.width, y: rect.y + rect.height })
      ];
      i0 = Math.min(...cantos.map((c) => c.i)) - 1;
      j0 = Math.min(...cantos.map((c) => c.j)) - 1;
      i1 = Math.max(...cantos.map((c) => c.i)) + 2;
      j1 = Math.max(...cantos.map((c) => c.j)) + 2;
    }

    if ((i1 - i0) * (j1 - j0) > MAX_CELULAS) {
      console.warn(
        `${MODULO} | cena grande demais para cobrir de névoa por inteiro`,
        { i0, j0, i1, j1 }
      );
      i1 = i0 + Math.min(i1 - i0, Math.floor(Math.sqrt(MAX_CELULAS)));
      j1 = j0 + Math.min(j1 - j0, Math.floor(Math.sqrt(MAX_CELULAS)));
    }

    for (let i = i0; i < i1; i++) {
      for (let j = j0; j < j1; j++) yield { i, j };
    }
  }

  /**
   * Vértices de uma célula em relação ao próprio centro, calculados uma vez
   * por redesenho.
   * @returns {number[]|null} [dx0,dy0,dx1,dy1,...]
   */
  #moldeDoHex() {
    const grid = canvas.grid;
    if (!grid) return null;

    const referencia = { i: 0, j: 0 };
    const centro = grid.getCenterPoint(referencia);
    if (!centro) return null;

    if (typeof grid.getVertices === "function") {
      const vertices = grid.getVertices(referencia);
      if (vertices?.length) {
        return vertices.flatMap((v) => [v.x - centro.x, v.y - centro.y]);
      }
    }

    // Reserva: hexágono regular. O `size` do Foundry é a distância entre lados
    // opostos, então o circunraio é size/√3 nas duas orientações; o giro é que
    // muda — vértice no topo (ponta para cima) ou na lateral (lado para cima).
    const raio = grid.size / Math.sqrt(3);
    const giro = grid.columns ? 0 : Math.PI / 6;
    const pontos = [];
    for (let k = 0; k < 6; k++) {
      const angulo = giro + (k * Math.PI) / 3;
      pontos.push(raio * Math.cos(angulo), raio * Math.sin(angulo));
    }
    return pontos;
  }

  /** @returns {number[]} vértices achatados [x0,y0,x1,y1,...] da célula dada */
  #poligonoEm(offset, molde) {
    const centro = canvas.grid.getCenterPoint(offset);
    const pontos = new Array(molde.length);
    for (let k = 0; k < molde.length; k += 2) {
      pontos[k] = centro.x + molde[k];
      pontos[k + 1] = centro.y + molde[k + 1];
    }
    return pontos;
  }
}
