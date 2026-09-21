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
