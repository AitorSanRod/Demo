// Agua del mar en franjas: cada una de su tono (más clara al fondo), con rayitas de luz sueltas, y el agua del
// camino, donde nada el Pokémon, con crestas que se mueven y espuma por delante.

import { between, hash, makeRng, periodicWave } from '../../paint/noise'
import { Pixmap, type Color } from '../../paint/pixmap'
import { FOAM, NEAR_WATER } from './palette'

/** Ondulación del borde de arriba de cada franja: largo de cada onda y altura, en píxeles de arte */
const SWELL = { length: 40, amp: 1.5 }

/** Fila del borde de arriba de una franja en cada columna (ondulado, para que no sea una línea recta) */
function swell(width: number, seed: number): (x: number) => number {
  const waves: [number, number, number][] = [[Math.round(width / SWELL.length), SWELL.amp, hash(seed, 0, 1) * 6], [Math.round(width / SWELL.length / 3), SWELL.amp * 0.6, hash(seed, 1, 1) * 6]]
  return (x) => Math.round(SWELL.amp * 1.6 + periodicWave(x, width, waves))
}

/** Rellena la franja bajo su borde ondulado: tono base y canto claro de 2 filas arriba */
function fillBelow(pix: Pixmap, top: (x: number) => number, base: Color, light: Color) {
  for (let x = 0; x < pix.w; x++) {
    pix.rect(x, top(x), 1, pix.h - top(x), base)
    pix.rect(x, top(x), 1, 1, light)
  }
}

/** Rayitas de luz por cada 100 píxeles de ancho y franja */
const GLINTS_PER_100 = 5

/**
 * Franja de mar de `height` píxeles: tono base, la fila de arriba más clara (el horizonte o la franja de detrás) y
 * rayitas de luz de 2 a 6 píxeles repartidas al azar
 */
export function waterBand(seed: number, width: number, height: number, colors: readonly Color[]): Pixmap {
  const rng = makeRng(seed)
  const pix = new Pixmap(width, height)
  const [shade, base, light] = colors
  const top = swell(width, seed)
  fillBelow(pix, top, base, light)
  const glints = Math.round((width / 100) * GLINTS_PER_100 * (height / 20))
  for (let i = 0; i < glints; i++) {
    const x = Math.round(rng() * width)
    const y = Math.round(between(rng, top(x) + 2, height - 1))
    const length = Math.round(between(rng, 2, 6))
    pix.rect(x, y, length, 1, light)
    pix.rect(x + 1, y + 1, length - 1, 1, shade)
  }
  return pix
}

/** Agua del camino: separación de las crestas en X e Y, en píxeles de arte, y cuánto avanzan en cada fotograma */
const CREST = { gapX: 34, gapY: 7, length: [5, 11] as const, step: 2, skip: 0.35 }

/** Agua del camino en `frames` fotogramas: las crestas se desplazan un poco de lado a lado, como olas */
export function nearWater(seed: number, width: number, height: number, frames: number): Pixmap[] {
  const [deep, base, light, crest] = NEAR_WATER
  return Array.from({ length: frames }, (_, f) => {
    const pix = new Pixmap(width, height)
    const top = swell(width, seed)
    fillBelow(pix, top, base, light)
    for (let row = 0, y = 6; y < height - 2; row++, y += CREST.gapY) {
      for (let col = 0; col * CREST.gapX < width; col++) {
        if (hash(col, row, seed + 3) < CREST.skip) continue
        const rowShift = Math.round(hash(row, 0, seed + 4) * 3) - 1
        const jitter = Math.round(hash(col, row, seed) * CREST.gapX)
        const length = CREST.length[0] + Math.round(hash(col, row, seed + 1) * (CREST.length[1] - CREST.length[0]))
        const sway = Math.round(Math.sin((2 * Math.PI * f) / frames + hash(col, row, seed + 2) * 6) * CREST.step)
        const x = col * CREST.gapX + jitter + sway
        const cy = y + rowShift + (col % 2)
        pix.rect(x, cy, length, 1, light)
        pix.rect(x + 2, cy - 1, Math.max(1, length - 4), 1, crest)
        pix.rect(x + 1, cy + 1, length, 1, deep)
      }
    }
    return pix
  })
}

/** Espuma de las olas de delante: crestas blancas redondeadas que se mecen */
export function foam(seed: number, width: number, frames: number): Pixmap[] {
  const rng = makeRng(seed + 31)
  const crests = Array.from({ length: Math.round(width / 40) }, (_, i) => ({ x: i * 40 + between(rng, 0, 20), w: Math.round(between(rng, 12, 24)) }))
  return Array.from({ length: frames }, (_, f) => {
    const pix = new Pixmap(width, 10)
    const lift = Math.round(Math.sin((2 * Math.PI * f) / frames) * 1.5)
    pix.rect(0, 6, width, 4, NEAR_WATER[1])
    for (const { x, w } of crests) {
      for (let k = 0; k < w; k++) {
        const bump = Math.round(Math.sin((Math.PI * k) / w) * 3)
        pix.rect(x + k, 6 - bump + lift, 1, bump + 1, FOAM[1])
        pix.set(x + k, 7 + lift, FOAM[0])
      }
    }
    return pix
  })
}
