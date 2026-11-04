// Casa de pueblo vista de frente: tejado a franjas con chimenea, paredes claras, puerta y ventanas.
// `scale` encoge todas las medidas (casas lejanas) sin perder el contorno de 1 píxel.

import { Pixmap, type Color } from '../paint/pixmap'

export interface HousePalette {
  /** Tejado: sombra, base y luz */
  roof: readonly Color[]
  roofInk: Color
  /** Paredes: sombra, base y luz */
  wall: readonly Color[]
  wallInk: Color
  /** Puerta y marcos: oscuro, base y luz */
  wood: readonly Color[]
  /** Cristal: base y reflejo */
  glass: readonly Color[]
  brick: Color
}

/** Medidas de una casa a escala 1, en píxeles de arte */
const BASE = { width: 64, roof: 22, wall: 30, overhang: 4, door: [10, 16], window: [10, 8], chimney: [6, 5] }
/** A partir de este ancho (a escala 1) la casa lleva cuatro ventanas */
const WIDE = 90

interface Measures {
  width: number
  roof: number
  wall: number
  overhang: number
  door: number[]
  window: number[]
  chimney: number[]
}

const scaled = (width: number, scale: number): Measures => {
  const s = (n: number) => Math.max(2, Math.round(n * scale))
  return {
    width: s(width),
    roof: s(BASE.roof),
    wall: s(BASE.wall),
    overhang: s(BASE.overhang),
    door: BASE.door.map(s),
    window: BASE.window.map(s),
    chimney: BASE.chimney.map(s),
  }
}

function roof(pix: Pixmap, p: HousePalette, m: Measures) {
  const stripe = Math.max(3, Math.round(m.roof / 5))
  for (let y = 0; y < m.roof; y++) {
    const inset = Math.round((m.roof - 1 - y) * 0.45)
    const tone = y === 0 ? 2 : (y + 1) % stripe === 0 ? 0 : 1
    pix.rect(inset, y, m.width - inset * 2, 1, p.roof[tone])
    pix.set(inset, y, p.roofInk)
    pix.set(m.width - inset - 1, y, p.roofInk)
  }
  pix.rect(m.roof * 0.45, 0, m.width - m.roof * 0.9, 1, p.roofInk)
  pix.rect(0, m.roof - 1, m.width, 1, p.roofInk)
  const [cw, ch] = m.chimney
  const cx = Math.round(m.width * 0.7)
  pix.rect(cx, 0, cw, ch, p.brick)
  pix.rect(cx - 1, 0, cw + 2, 1, p.roofInk)
  pix.rect(cx - 1, 0, 1, ch, p.roofInk)
  pix.rect(cx + cw, 0, 1, ch, p.roofInk)
}

function walls(pix: Pixmap, p: HousePalette, m: Measures) {
  const left = m.overhang
  const width = m.width - m.overhang * 2
  for (let x = left; x < left + width; x++) {
    const tone = x > left + width - 5 ? 0 : x < left + 3 ? 2 : 1
    pix.rect(x, m.roof, 1, m.wall, p.wall[tone])
  }
  pix.rect(left, m.roof, width, 2, p.wall[0])
  pix.rect(left - 1, m.roof, 1, m.wall, p.wallInk)
  pix.rect(left + width, m.roof, 1, m.wall, p.wallInk)
  pix.rect(left - 1, m.roof + m.wall - 1, width + 2, 1, p.wallInk)
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
  const mortar = (x: number, y: number) => {
    if (pix.get(x, y) === p.wall[1] || pix.get(x, y) === p.wall[2]) pix.set(x, y, p.wall[0])
  }
  for (let y = m.roof + 2 + course, k = 0; y < m.roof + m.wall - 1; y += course, k++) {
    for (let x = left; x < right; x++) mortar(x, y)
    const shift = (k % 2) * Math.floor(length / 2)
    for (let x = left + shift; x < right; x += length) for (let dy = 1; dy < course && y + dy < m.roof + m.wall - 1; dy++) mortar(x, y + dy)
  }
}

/** Punto de salida del humo de la chimenea, relativo a la esquina de arriba a la izquierda de la casa */
export function chimneyTop(width = BASE.width, scale = 1): { x: number; y: number } {
  const m = scaled(width, scale)
  return { x: Math.round(m.width * 0.7) + Math.floor(m.chimney[0] / 2), y: -1 }
}

function door(pix: Pixmap, p: HousePalette, m: Measures) {
  const [w, h] = m.door
  const x = Math.round(m.width / 2 - w / 2)
  const top = m.roof + m.wall - 1 - h
  pix.rect(x - 1, top - 1, w + 2, h + 1, p.wood[0])
  pix.rect(x, top, w, h, p.wood[1])
  pix.rect(x, top, Math.max(1, Math.round(w / 5)), h, p.wood[2])
  pix.rect(x + Math.floor(w / 2), top, 1, h, p.wood[0])
}

function windowAt(pix: Pixmap, p: HousePalette, m: Measures, x: number) {
  const [w, h] = m.window
  const top = m.roof + Math.round(m.wall * 0.23)
  pix.rect(x - 1, top - 1, w + 2, h + 2, p.wood[0])
  pix.rect(x, top, w, h, p.glass[0])
  pix.rect(x + 1, top + 1, Math.max(1, Math.round(w / 3)), Math.max(1, Math.round(h / 4)), p.glass[1])
  pix.rect(x + Math.floor(w / 2), top, 1, h, p.wood[2])
  pix.rect(x, top + Math.floor(h / 2), w, 1, p.wood[2])
}

/** Casa de `width` píxeles de ancho a escala 1, dibujada a `scale`: puerta en el centro y dos o cuatro ventanas */
export function house(p: HousePalette, width = BASE.width, scale = 1): Pixmap {
  const m = scaled(width, scale)
  const pix = new Pixmap(m.width, m.roof + m.wall, false)
  walls(pix, p, m)
  bricks(pix, p, m, scale)
  roof(pix, p, m)
  door(pix, p, m)
  const windows = width >= WIDE ? [0.1, 0.27, 0.63, 0.8] : [0.17, 0.67]
  for (const at of windows) windowAt(pix, p, m, Math.round(m.width * at))
  return pix
}
