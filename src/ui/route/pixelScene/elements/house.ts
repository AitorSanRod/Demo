// Casa de pueblo vista de frente: tejado de tejas con chimenea, paredes de ladrillo claro, puerta y ventanas.
// Luz arriba a la izquierda: el alero y la chimenea echan sombra, y el contorno oscuro solo va abajo y a la derecha.
// `scale` encoge todas las medidas (casas lejanas) sin perder el contorno de 1 píxel.

import { Pixmap, type Color } from '../paint/pixmap'
import { chimney, door, windowAt } from './houseOpenings'

export interface HousePalette {
  /** Tejado: sombra, base y luz */
  roof: readonly Color[]
  roofInk: Color
  /** Paredes: sombra del alero, sombra, base y luz */
  wall: readonly Color[]
  wallInk: Color
  /** Puerta y marcos: oscuro, base y luz */
  wood: readonly Color[]
  /** Cristal: sombra del marco, base y reflejo */
  glass: readonly Color[]
  /** Ladrillo de la chimenea: sombra, base y luz */
  brick: readonly Color[]
}

/** Medidas de una casa a escala 1, en píxeles de arte; `wall` es la planta baja y `floor`, cada piso de encima */
const BASE = { width: 64, roof: 22, wall: 30, floor: 18, overhang: 4, eave: 3, door: [10, 16], window: [10, 8], chimney: [6, 5] }
/** Altura de la ventana dentro de su planta, en fracción de la planta baja */
const WINDOW_AT = 0.23
/** A partir de este ancho (a escala 1) la casa lleva cuatro ventanas */
const WIDE = 90
/** Lo que entra cada fila del tejado por cada fila que sube (pendiente de los lados) */
const ROOF_SLOPE = 0.45
/** Posición de la chimenea, en fracción del ancho de la casa */
const CHIMNEY_AT = 0.7

export interface Measures {
  width: number
  roof: number
  /** Alto de toda la fachada (planta baja y pisos) */
  wall: number
  /** Alto de cada piso de encima de la planta baja */
  floor: number
  floors: number
  overhang: number
  /** Filas de la sombra que el alero echa sobre la pared */
  eave: number
  door: number[]
  window: number[]
  chimney: number[]
  chimneyX: number
}

const scaled = (width: number, scale: number, floors = 1): Measures => {
  const s = (n: number) => Math.max(2, Math.round(n * scale))
  const w = s(width)
  return {
    width: w,
    roof: s(BASE.roof),
    wall: s(BASE.wall) + s(BASE.floor) * (floors - 1),
    floor: s(BASE.floor),
    floors,
    overhang: s(BASE.overhang),
    eave: s(BASE.eave),
    door: BASE.door.map(s),
    window: BASE.window.map(s),
    chimney: BASE.chimney.map(s),
    chimneyX: Math.round(w * CHIMNEY_AT),
  }
}

/** Tejas en hiladas: canto iluminado arriba, base y sombra de la hilada de encima; lado derecho en sombra */
function roof(pix: Pixmap, p: HousePalette, m: Measures) {
  const course = Math.max(3, Math.round(m.roof / 5))
  for (let y = 0; y < m.roof - 1; y++) {
    const inset = Math.round((m.roof - 1 - y) * ROOF_SLOPE)
    const row = y % course
    const tone = row === course - 1 ? 0 : row === 0 && course > 3 ? 2 : 1
    const right = m.width - inset - 1
    pix.rect(inset, y, m.width - inset * 2, 1, p.roof[tone])
    pix.set(inset + 1, y, p.roof[2])
    pix.rect(right - 2, y, 2, 1, p.roof[0])
    pix.set(inset, y, p.roof[0])
    pix.set(right, y, p.roofInk)
  }
  const top = Math.round((m.roof - 1) * ROOF_SLOPE)
  pix.rect(top, 0, m.width - top * 2, 1, p.roof[2])
  pix.rect(0, m.roof - 1, m.width, 1, p.roofInk)
}

function walls(pix: Pixmap, p: HousePalette, m: Measures) {
  const left = m.overhang
  const width = m.width - m.overhang * 2
  const bottom = m.roof + m.wall - 1
  for (let x = left; x < left + width; x++) {
    const tone = x > left + width - 5 ? 1 : x < left + 3 ? 3 : 2
    pix.rect(x, m.roof, 1, m.wall, p.wall[tone])
  }
  pix.rect(left, m.roof, width, m.eave, p.wall[0])
  pix.rect(left, bottom - 1, width, 1, p.wall[1])
  pix.rect(left - 1, m.roof, 1, m.wall - 1, p.wall[1])
  pix.rect(left + width, m.roof, 1, m.wall, p.wallInk)
  pix.rect(left - 1, bottom, width + 2, 1, p.wallInk)
}

/** Ladrillo a escala 1: alto de cada hilada y largo de cada ladrillo; en casas más pequeñas que `minScale` no se dibuja */
const BRICK = { course: 4, length: 8, minScale: 0.6 }

/** Juntas de ladrillo en el tono de sombra de la pared, solo sobre la parte clara (respeta las sombras) */
function bricks(pix: Pixmap, p: HousePalette, m: Measures, scale: number) {
  if (scale < BRICK.minScale) return
  const course = Math.max(3, Math.round(BRICK.course * scale))
  const length = Math.max(5, Math.round(BRICK.length * scale))
  const left = m.overhang
  const right = m.width - m.overhang
  const bottom = m.roof + m.wall - 2
  const mortar = (x: number, y: number) => {
    if (pix.get(x, y) === p.wall[2] || pix.get(x, y) === p.wall[3]) pix.set(x, y, p.wall[1])
  }
  for (let y = m.roof + m.eave + course, k = 0; y < bottom; y += course, k++) {
    for (let x = left; x < right; x++) mortar(x, y)
    const shift = (k % 2) * Math.floor(length / 2)
    for (let x = left + shift; x < right; x += length) for (let dy = 1; dy < course && y + dy < bottom; dy++) mortar(x, y + dy)
  }
}

/** Punto de salida del humo de la chimenea, relativo a la esquina de arriba a la izquierda de la casa */
export function chimneyTop(width = BASE.width, scale = 1): { x: number; y: number } {
  const m = scaled(width, scale)
  return { x: m.chimneyX + Math.floor(m.chimney[0] / 2), y: -1 }
}

/** Cornisa de piedra entre dos plantas: canto iluminado arriba y su sombra debajo */
function cornices(pix: Pixmap, p: HousePalette, m: Measures) {
  for (let k = 1; k < m.floors; k++) {
    const y = m.roof + k * m.floor
    pix.rect(m.overhang - 1, y, m.width - m.overhang * 2 + 1, 1, p.wall[3])
    pix.rect(m.overhang - 1, y + 1, m.width - m.overhang * 2 + 1, 1, p.wall[0])
    pix.set(m.width - m.overhang, y, p.wallInk)
    pix.set(m.width - m.overhang, y + 1, p.wallInk)
  }
}

/** Fila de arriba del cristal de las ventanas de cada planta, de la más alta a la planta baja */
function windowRows(m: Measures): number[] {
  const ground = m.roof + m.wall - Math.round((m.wall - m.floor * (m.floors - 1)) * (1 - WINDOW_AT))
  const upper = Array.from({ length: m.floors - 1 }, (_, k) => m.roof + k * m.floor + Math.round((m.floor - m.window[1]) / 2) + 1)
  return [...upper, ground]
}

/**
 * Casa de `width` píxeles de ancho a escala 1, dibujada a `scale`, con `floors` plantas: puerta en el centro de la
 * planta baja y dos o cuatro ventanas por planta (las de arriba, también sobre la puerta)
 */
export function house(p: HousePalette, width = BASE.width, scale = 1, floors = 1): Pixmap {
  const m = scaled(width, scale, floors)
  const pix = new Pixmap(m.width, m.roof + m.wall, false)
  walls(pix, p, m)
  bricks(pix, p, m, scale)
  cornices(pix, p, m)
  roof(pix, p, m)
  chimney(pix, p, m)
  door(pix, p, m)
  const columns = width >= WIDE ? [0.1, 0.27, 0.63, 0.8] : [0.17, 0.67]
  const rows = windowRows(m)
  rows.forEach((top, i) => {
    const upper = i < rows.length - 1
    const at = upper ? [...columns, 0.5 - BASE.window[0] / 2 / width] : columns
    for (const x of at) windowAt(pix, p, m, Math.round(m.width * x), top)
  })
  return pix
}
