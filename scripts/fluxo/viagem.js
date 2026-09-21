import { abrirDialogoPintar } from "../canvas/ferramenta-pintar.js";
import { lerHex, revelarVizinhos, tipoHexDaGrade } from "../dados/hexes.js";
import { lerEstado, gravarEstado } from "../dados/estado.js";
import { diasDeViagem } from "../regras/custo-viagem.js";
import { chaveHex, offsetDaChave, saoAdjacentes } from "../regras/vizinhos-hex.js";
import { rolarEncontro } from "./encontro.js";

/** Movimento em curso já aprovado, para não reentrar no hook. */
let movimentoAprovado = null;

/** Trava enquanto uma confirmação de viagem está em andamento, para recusar arrastos sobrepostos. */
let confirmacaoEmAndamento = false;

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

    if (confirmacaoEmAndamento) {
      ui.notifications.warn(game.i18n.localize("JORNADA.viagem.confirmacaoEmAndamento"));
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
  confirmacaoEmAndamento = true;
  try {
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
  } finally {
    confirmacaoEmAndamento = false;
  }
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
