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
