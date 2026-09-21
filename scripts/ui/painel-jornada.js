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

  /** Instância única: o id do ApplicationV2 é fixo, duas não podem coexistir. */
  static #instancia = null;

  static abrir() {
    PainelJornada.#instancia ??= new PainelJornada();
    PainelJornada.#instancia.render({ force: true });
    return PainelJornada.#instancia;
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
                title="${c.curto.motivo ? foundry.utils.escapeHTML(t(c.curto.motivo)) : ""}">
          ${t("JORNADA.painel.descansoCurto")}
        </button>
        <button type="button" data-action="descansoLongo" ${c.longo.permitido ? "" : "disabled"}
                title="${c.longo.motivo ? foundry.utils.escapeHTML(t(c.longo.motivo)) : ""}">
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

  /**
   * Revalida antes de gravar: o botão desabilitado na interface não basta,
   * porque quem não é Mestre nem sequer consegue escrever na flag.
   * @returns {{permitido: boolean, estado: object}|null} null se barrado
   */
  #autorizarDescanso(regra) {
    if (!game.user.isGM) {
      ui.notifications.warn(game.i18n.localize("JORNADA.avisos.somenteMestre"));
      return null;
    }

    const scene = canvas.scene;
    const estado = lerEstado(scene);
    const hex = estado.hexAtual ? lerHex(scene, offsetDaChave(estado.hexAtual)) : null;
    const veredito = regra({
      descansosCurtos: estado.descansosCurtos,
      emSantuario: hex?.santuario === true
    });

    if (!veredito.permitido) {
      ui.notifications.warn(game.i18n.localize(veredito.motivo));
      return null;
    }
    return { scene, estado };
  }

  static async #descansoCurto() {
    const autorizado = this.#autorizarDescanso(podeDescansoCurto);
    if (!autorizado) return;
    await gravarEstado(autorizado.scene, aplicarDescansoCurto(autorizado.estado));
    this.render();
  }

  static async #descansoLongo() {
    const autorizado = this.#autorizarDescanso(podeDescansoLongo);
    if (!autorizado) return;
    await gravarEstado(autorizado.scene, aplicarDescansoLongo(autorizado.estado));
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
          <input type="text" name="texto" value="${foundry.utils.escapeHTML(textos[id] ?? "")}">
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
