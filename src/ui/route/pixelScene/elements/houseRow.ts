// Fila de casas sobre césped ondulado: no van alineadas (cada una con su tamaño, su altura sobre el césped y su
// hueco), con una calle delante a la que baja el caminito de cada puerta y árboles en los huecos.

import { between, makeRng, pick } from '../paint/noise'
import { Pixmap, type Color } from '../paint/pixmap'
import { chimneyTop, house, type HousePalette } from './house'
import { lane, lawn } from './lawn'
import { broadTree, type TreePalette } from './trees'
import { walkway, type WalkwayPalette } from './walkway'

/** Ancho de una casa normal a escala 1, en píxeles de arte */
const HOUSE_WIDTH = 64

/** Edificio especial de la fila: cómo se dibuja a una escala y, si tiene chimenea, dónde sale el humo */
export interface Landmark {
  draw: (scale: number) => Pixmap
  chimney?: (scale: number) => { x: number; y: number }
}

/** Colores y piezas de un pueblo o una ciudad */
export interface TownStyle {
  houses: readonly HousePalette[]
  /** Edificios especiales, si la fila los lleva: van en los puestos 2.º, 4.º… de la fila */
  big: readonly Landmark[]
  /** Césped de oscuro a claro */
  lawn: readonly Color[]
  trees: TreePalette
  street: { fill: Color; top: Color; ink: Color }
  walkway: WalkwayPalette
  /** Probabilidad de que una casa tenga la chimenea encendida; al menos una por fila */
  smokeChance: number
  /** Plantas de cada casa: [mín, máx]; sin él, todas de una */
  floors?: [number, number]
}

export interface Row {
  width: number
  height: number
  /** Alto del césped, en píxeles de arte */
  lawn: number
  /** Escala de las casas: [mín, máx] */
  scale: [number, number]
  /** Tamaño de las copas: [mín, máx] */
  tree: [number, number]
  houses: number
  /** Tonos del césped que usa esta fila (las lejanas, más claros) */
  grass: readonly number[]
  bigBuilding: boolean
  /** Distancia de la calle al borde del césped y su grosor, en píxeles de arte */
  laneOffset: number
  laneWidth: number
}

/**
 * Una fila de casas sin solaparse: se colocan una tras otra con huecos al azar. Delante corre una calle a la que baja
 * el caminito de cada casa; en los huecos hay árboles y en uno, otro árbol más cerca. Devuelve también las
 * chimeneas que echan humo.
 */
export function houseRow(seed: number, row: Row, style: TownStyle): { pixmap: Pixmap; emitters: { x: number; y: number }[] } {
  const rng = makeRng(seed)
  const pix = new Pixmap(row.width, row.height)
  const top = lawn(pix, rng, row.lawn, row.grass.map((i) => style.lawn[i]), seed)
  const images = Array.from({ length: row.houses }, (_, i) => {
    const special = row.bigBuilding && i % 2 === 1 ? style.big[(i - 1) / 2] : undefined
    if (special) {
      const scale = between(rng, ...row.scale)
      const chimney = special.chimney?.(scale)
      return { image: special.draw(scale), chimney, smokes: chimney !== undefined && rng() < style.smokeChance }
    }
    const palette = pick(rng, style.houses)
    const scale = between(rng, ...row.scale)
    const floors = style.floors ? Math.round(between(rng, style.floors[0] - 0.49, style.floors[1] + 0.49)) : 1
    return { image: house(palette, HOUSE_WIDTH, scale, floors), chimney: chimneyTop(HOUSE_WIDTH, scale), smokes: rng() < style.smokeChance }
  })
  if (!images.some((entry) => entry.smokes)) pick(rng, images.filter((entry) => entry.chimney)).smokes = true
  const free = row.width - images.reduce((sum, { image }) => sum + image.w, 0)
  const weights = images.map(() => between(rng, 0.5, 1.5))
  const total = weights.reduce((a, b) => a + b, 0)
  const gaps = weights.map((w) => (free * w) / total)
  const placed: ((typeof images)[number] & { x: number })[] = []
  let x = 0
  images.forEach((entry, i) => {
    x += gaps[i]
    placed.push({ ...entry, x: Math.round(x) })
    x += entry.image.w
  })
  placed.forEach(({ x: hx }, i) => {
    const gapMiddle = hx - gaps[i] / 2
    if (gaps[i] > row.tree[1] * 2.5) broadTree(pix, rng, gapMiddle, top(gapMiddle) + 2, between(rng, ...row.tree), 8, style.trees)
  })
  const laneY = lane(pix, top, row.laneOffset, row.laneWidth, style.street)
  const emitters: { x: number; y: number }[] = []
  for (const { x: hx, image, chimney, smokes } of placed) {
    const door = hx + image.w / 2
    const base = laneY(door) - Math.round(between(rng, 3, 6))
    walkway(pix, door, base, image.w * 0.12, laneY(door), style.walkway)
    pix.stamp(image, hx, base - image.h)
    if (smokes && chimney) emitters.push({ x: hx + chimney.x, y: base - image.h + chimney.y })
  }
  const widest = gaps.indexOf(Math.max(...gaps))
  broadTree(pix, rng, placed[widest].x - gaps[widest] * 0.4, pix.h - 2, row.tree[1], 8, style.trees)
  return { pixmap: pix, emitters }
}
