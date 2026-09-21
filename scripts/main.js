import { CamadaJornada, acoesDaJornada } from "./canvas/camada-hex.js";
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

  acoesDaJornada.abrirPainel = () => PainelJornada.abrir();
  acoesDaJornada.definirGrupo = () => definirTokenDoGrupo();

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
