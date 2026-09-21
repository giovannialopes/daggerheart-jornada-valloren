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
