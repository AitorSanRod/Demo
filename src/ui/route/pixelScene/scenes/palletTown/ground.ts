// Suelo de Pueblo Paleta: camino de arena con un tramo de plaza empedrada, entre dos franjas de césped.
// La plaza se decide por baldosas: cada fila empieza y acaba en una baldosa distinta (borde escalonado) y quedan
// algunas baldosas sueltas en la arena; todo el borde lleva junta.

import { grassField } from '../../elements/grass'
import { between, hash, makeRng } from '../../paint/noise'
import { Pixmap } from '../../paint/pixmap'
import { PATH } from '../meadow/ground'
import { GRASS, GRASS_INK } from '../meadow/palette'
import { MORTAR, PAVING, SAND, SAND_INK } from './palette'

/** Baldosa de la plaza: ancho y alto en píxeles de arte (cada fila va desplazada media baldosa) */
const TILE = { width: 12, height: 7 }
/** Tesela del camino (larga, para que la plaza aparezca de tarde en tarde) y tramo de plaza dentro de ella, en baldosas */
const PATH_TILES = 120
const PLAZA = { from: 45, to: 75 }
/** Cuántas baldosas puede adelantarse o retrasarse cada fila en los extremos */
const EDGE_JITTER = 1
/** Probabilidad de una baldosa suelta a dos baldosas del borde, en cada fila y extremo */
const LOOSE_CHANCE = 0.35

const FIELD = [GRASS[1], GRASS[2], GRASS[4]]
const NEIGHBORS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const

function tileAt(x: number, y: number) {
  const row = Math.floor((y - PATH.dirtTop) / TILE.height)
  const shifted = x + (row % 2) * (TILE.width / 2)
  return { tx: Math.floor(shifted / TILE.width), row, inX: shifted % TILE.width, inY: (y - PATH.dirtTop) % TILE.height }
}

function isPlazaTile(tx: number, row: number, seed: number): boolean {
  const jitter = (k: number) => Math.floor(hash(row, k, seed) * (EDGE_JITTER * 2 + 1)) - EDGE_JITTER
  const start = PLAZA.from + jitter(1)
  const end = PLAZA.to + jitter(2)
  if (tx >= start && tx < end) return true
  return (tx === start - 2 || tx === end + 1) && hash(tx, row, seed + 3) < LOOSE_CHANCE
}

/** Si el píxel es plaza; fuera de la franja de tierra cuenta como plaza para no marcar junta contra el césped */
function plazaAt(x: number, y: number, seed: number): boolean {
  if (y < PATH.dirtTop || y >= PATH.dirtBottom) return true
  const { tx, row } = tileAt(x, y)
  return isPlazaTile(tx, row, seed)
}

function paving(pix: Pixmap, x: number, y: number, seed: number) {
  const { tx, row, inX, inY } = tileAt(x, y)
  const border = NEIGHBORS.some(([dx, dy]) => !plazaAt(x + dx, y + dy, seed))
  const tone = 1 + Math.floor(hash(tx, row, seed) * 2)
  const shade = inX === TILE.width - 1 || inY === TILE.height - 1
  pix.set(x, y, border || inX === 0 || inY === 0 ? MORTAR : inY === 1 ? PAVING[3] : shade ? PAVING[0] : PAVING[tone])
}

export function townPath(seed: number): Pixmap {
  const rng = makeRng(seed + 22)
  const pix = new Pixmap(PATH_TILES * TILE.width, PATH.height)
  grassField(pix, rng, 0, PATH.dirtTop, FIELD)
  grassField(pix, rng, PATH.dirtBottom, PATH.height - PATH.dirtBottom, FIELD)
  for (let x = 0; x < pix.w; x++) {
    for (let y = PATH.dirtTop; y < PATH.dirtBottom; y++) {
      if (plazaAt(x, y, seed)) paving(pix, x, y, seed)
      else pix.set(x, y, y < PATH.dirtTop + 3 ? SAND[0] : SAND[1])
    }
    pix.set(x, PATH.dirtTop, GRASS_INK)
    pix.set(x, PATH.dirtBottom, GRASS[3])
  }
  for (let i = 0; i < 40; i++) {
    const x = Math.round(rng() * pix.w)
    const y = Math.round(between(rng, PATH.dirtTop + 6, PATH.dirtBottom - 4))
    if (plazaAt(x, y, seed) || plazaAt(x + 2, y, seed)) continue
    pix.rect(x, y, 2, 1, SAND_INK)
    pix.rect(x, y - 1, 2, 1, SAND[3])
  }
  return pix
}
