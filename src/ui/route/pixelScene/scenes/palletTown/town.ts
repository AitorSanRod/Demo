// Planos del pueblo: dos filas de casas a distinta distancia sobre césped ondulado, y jardines con valla blanca
// junto al camino. Las casas no van alineadas: cada una tiene su tamaño, su altura sobre el césped, su hueco y
// un caminito de arena desde la puerta.

import { flowerBed, picketFence } from '../../elements/fence'
import { chimneyTop, house, type HousePalette } from '../../elements/house'
import { lane, lawn } from '../../elements/lawn'
import { bush } from '../../elements/shrubs'
import { broadTree } from '../../elements/trees'
import { between, makeRng, pick } from '../../paint/noise'
import { Pixmap } from '../../paint/pixmap'
import { GRASS, NEAR_TREES, NEAR_TREES_INK, TRUNK, TRUNK_INK } from '../meadow/palette'
import { walkway } from './walkway'
import { BED_FLOWERS, BIG_BUILDING, BLUE_HOUSE, FENCE, GARDEN_BUSH, LAWN, ORANGE_HOUSE, RED_HOUSE, SAND, SAND_INK, SOIL } from './palette'

const TREES = { leaves: { colors: NEAR_TREES, ink: NEAR_TREES_INK }, trunk: { colors: TRUNK, ink: TRUNK_INK } }
const HOUSES = [ORANGE_HOUSE, BLUE_HOUSE, RED_HOUSE]
const STREET = { fill: SAND[1], top: SAND[0], ink: SAND_INK }
/** Probabilidad de que una casa tenga la chimenea encendida (humea a ratos, ver engine/smoke.ts); al menos una por fila */
const SMOKE_CHANCE = 0.4
/** Ancho del edificio grande a escala 1, en píxeles de arte */
const BIG_WIDTH = 104

interface Row {
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
 * Una fila de casas sin solaparse: se colocan una tras otra con huecos al azar. Delante corre una calle de arena a la
 * que baja el caminito de cada casa; en los huecos hay árboles y en uno, otro árbol más cerca. Devuelve también
 * las chimeneas que echan humo.
 */
function houseRow(seed: number, row: Row): { pixmap: Pixmap; emitters: { x: number; y: number }[] } {
  const rng = makeRng(seed)
  const pix = new Pixmap(row.width, row.height)
  const top = lawn(pix, rng, row.lawn, row.grass.map((i) => LAWN[i]), seed)
  const images = Array.from({ length: row.houses }, (_, i) => {
    const big = row.bigBuilding && i === 1
    const palette: HousePalette = big ? BIG_BUILDING : pick(rng, HOUSES)
    const width = big ? BIG_WIDTH : 64
    const scale = between(rng, ...row.scale)
    return { image: house(palette, width, scale), chimney: chimneyTop(width, scale), smokes: rng() < SMOKE_CHANCE }
  })
  if (!images.some((entry) => entry.smokes)) pick(rng, images).smokes = true
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
    if (gaps[i] > row.tree[1] * 2.5) broadTree(pix, rng, gapMiddle, top(gapMiddle) + 2, between(rng, ...row.tree), 8, TREES)
  })
  const laneY = lane(pix, top, row.laneOffset, row.laneWidth, STREET)
  const emitters: { x: number; y: number }[] = []
  for (const { x: hx, image, chimney, smokes } of placed) {
    const door = hx + image.w / 2
    const base = laneY(door) - Math.round(between(rng, 3, 6))
    walkway(pix, door, base, image.w * 0.12, laneY(door))
    pix.stamp(image, hx, base - image.h)
    if (smokes) emitters.push({ x: hx + chimney.x, y: base - image.h + chimney.y })
  }
  const widest = gaps.indexOf(Math.max(...gaps))
  broadTree(pix, rng, placed[widest].x - gaps[widest] * 0.4, pix.h - 2, row.tree[1], 8, TREES)
  return { pixmap: pix, emitters }
}

/** Casas pequeñas y lejanas, pocas y separadas */
export const farTown = (seed: number) =>
  houseRow(seed + 30, { width: 600, height: 70, lawn: 30, scale: [0.45, 0.6], tree: [5, 7], houses: 3, grass: [1, 2, 3], bigBuilding: false, laneOffset: 10, laneWidth: 3 })

/** Casas medianas más cerca, con el edificio grande */
export const townRow = (seed: number) =>
  houseRow(seed + 20, { width: 560, height: 110, lawn: 44, scale: [0.72, 0.95], tree: [9, 13], houses: 3, grass: [0, 1, 2, 3], bigBuilding: true, laneOffset: 14, laneWidth: 5 })

/** Tramos de jardín: parterre de flores tras una valla blanca, con matas redondas entre tramo y tramo */
export function gardens(seed: number): Pixmap {
  const rng = makeRng(seed + 21)
  const pix = new Pixmap(480, 34)
  const baseY = pix.h - 1
  for (const [x, width] of [[12, 140], [236, 110]]) {
    flowerBed(pix, rng, x + 3, width - 6, baseY - 2, SOIL, GRASS[1], BED_FLOWERS)
    picketFence(pix, x, width, baseY, FENCE)
  }
  bush(pix, rng, 190, baseY, 26, 16, GARDEN_BUSH)
  bush(pix, rng, 400, baseY, 34, 20, GARDEN_BUSH)
  return pix
}
