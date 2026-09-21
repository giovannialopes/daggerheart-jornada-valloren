import { abrirDialogoPintar } from "../canvas/ferramenta-pintar.js";
import { MODULO, lerHex, revelarVizinhos, tipoHexDaGrade } from "../dados/hexes.js";
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
    // A conversão de coordenadas usa `canvas.grid`, que é a grade da cena
    // aberta: se o token for de outra cena, não há como calcular o offset.
    if (!scene?.id || scene.id !== canvas.scene?.id) return true;

    const tipo = tipoHexDaGrade(scene.grid?.type);
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
    confirmarViagem(scene, documento, destino, tipo).catch((erro) => {
      console.error(`${MODULO} | falha ao confirmar a viagem`, erro);
      ui.notifications.error(game.i18n.localize("JORNADA.viagem.erroInesperado"));
    });
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
      // Mestre desistiu de pintar: sem habitat não há o que confirmar.
      if (!hex.habitat) {
        ui.notifications.warn(game.i18n.localize("JORNADA.viagem.pinturaCancelada"));
        return;
      }
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

  // O `preUpdateToken` seguinte consome o flag e o zera. Se o update falhar ou
  // nem disparar o hook (cena bloqueada, veto de outro módulo, token apagado,
  // update sem diferença), o `finally` garante que ele não fique armado.
  movimentoAprovado = documento.id;
  try {
    await documento.update({ x: canto?.x ?? centro.x, y: canto?.y ?? centro.y });
  } finally {
    if (movimentoAprovado === documento.id) movimentoAprovado = null;
  }

  await gravarEstado(scene, {
    hexAtual: chaveHex(destino),
    dia: cobrarDias ? estado.dia + dias : estado.dia
  });
}
