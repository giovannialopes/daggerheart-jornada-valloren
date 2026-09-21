import { lerHexes, tipoHexDaGrade } from "../dados/hexes.js";
import { offsetDaChave } from "../regras/vizinhos-hex.js";

const COR_NEVOA = 0x0b0e14;
const ALPHA_NEVOA_JOGADOR = 1.0;
const ALPHA_NEVOA_MESTRE = 0.55;
const COR_CORROMPIDO = 0x3a2a4d;
const COR_SANTUARIO = 0xe3c46a;

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
          button: true,
          onChange: () => acoesDaJornada.definirGrupo?.()
        },
        painel: {
          name: "painel",
          order: 3,
          title: "JORNADA.controles.painel",
          icon: "fa-solid fa-scroll",
          button: true,
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
