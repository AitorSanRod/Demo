/** Pokémon por fila del grupo que lucha contra el jefe */
const PER_ROW = 3
/** Separación entre Pokémon de una fila, en % del ancho de la escena; las filas impares van medio hueco corridas */
const COL_GAP = 16
/** Centro de la primera columna, en % del ancho de la escena */
const FIRST_COL = 9
/** Píxeles que sube cada fila sobre la de delante */
const ROW_RISE = 34
/** Escala de cada fila respecto a la de delante (las de atrás, más lejos, se ven más pequeñas) */
const ROW_SHRINK = 0.86
/** Desorden máximo de cada Pokémon: en % del ancho hacia los lados y en píxeles hacia arriba */
const JITTER_X = 4
const JITTER_RISE = 12

/** Dónde se pinta un Pokémon del grupo: `left` en % del ancho, `rise` en px sobre el suelo; `z` ordena las filas */
interface PartySpot {
  left: number
  rise: number
  scale: number
  z: number
}

/** Número fijo en [0, 1) a partir de un texto, para que el desorden de cada Pokémon no cambie al repintar */
function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return (h >>> 0) / 4294967296
}

/**
 * Sitio del Pokémon `index` del grupo: filas de PER_ROW al tresbolillo que suben hacia el fondo, y cada uno algo
 * movido según su id, para que el grupo no parezca una rejilla
 */
export function partySpot(index: number, id: string): PartySpot {
  const row = Math.floor(index / PER_ROW)
  const col = index % PER_ROW
  const stagger = row % 2 === 1 ? COL_GAP / 2 : 0
  return {
    left: FIRST_COL + col * COL_GAP + stagger + (hash(id) - 0.5) * 2 * JITTER_X,
    rise: row * ROW_RISE + hash(`${id}:rise`) * JITTER_RISE,
    scale: ROW_SHRINK ** row,
    z: 10 - row,
  }
}
