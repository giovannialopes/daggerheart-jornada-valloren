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
