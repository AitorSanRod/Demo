// Matas de hierba y flores que se mecen: cada fotograma inclina las puntas según una onda que da la vuelta completa,
// así el bucle de fotogramas no da saltos.

import { between, type Rng } from '../paint/noise'
import { Pixmap, type Color } from '../paint/pixmap'
import { ramp } from '../paint/shade'

interface Tuft {
  x: number
  blades: { dx: number; height: number; lean: number }[]
  flower?: { petals: Color; center: Color }
}

export interface TuftStyle {
  grass: readonly Color[]
  minHeight: number
  maxHeight: number
  /** Desplazamiento máximo de la punta al mecerse, en píxeles de arte */
  sway: number
}

export function scatterTufts(rng: Rng, width: number, count: number, style: TuftStyle, flowers: Tuft['flower'][]): Tuft[] {
  return Array.from({ length: count }, () => {
    const blades = Array.from({ length: Math.round(between(rng, 3, 7)) }, () => ({
      dx: Math.round(between(rng, -2, 2)),
      height: Math.round(between(rng, style.minHeight, style.maxHeight)),
      lean: between(rng, -0.35, 0.35),
    }))
    const flower = rng() < 0.3 ? flowers[Math.floor(rng() * flowers.length)] : undefined
    return { x: Math.round(rng() * width), blades, flower }
  })
}

function paintTuft(pix: Pixmap, tuft: Tuft, phase: number, style: TuftStyle) {
  const baseY = pix.h - 1
  const wave = Math.sin(phase + tuft.x * 0.09)
  let tip = { x: tuft.x, y: baseY }
  for (const blade of tuft.blades) {
    for (let j = 0; j < blade.height; j++) {
      const k = j / blade.height
      const bend = (blade.lean * j + wave * style.sway * k * k) | 0
      const x = tuft.x + blade.dx + bend
      const y = baseY - j
      pix.set(x, y, ramp(style.grass, 0.2 + 0.75 * k, x, y, 0))
      if (j === blade.height - 1 && y < tip.y) tip = { x, y }
    }
  }
  if (tuft.flower) flower(pix, tip.x, tip.y - 1, tuft.flower.petals, tuft.flower.center)
}

/**
 * Hierba plana al estilo Pokémon: color base con marcas «ʌʌ» oscuras repartidas en una rejilla con algo de azar
 * y algún brillo suelto. `colors`: sombra, base y brillo.
 */
export function grassField(pix: Pixmap, rng: Rng, top: number, height: number, colors: readonly Color[]) {
  const [shade, base, shine] = colors
  pix.rect(0, top, pix.w, height, base)
  for (let y = top + 2; y < top + height; y += 4)
    for (let x = (y / 4) % 2 === 0 ? 0 : 4; x < pix.w; x += 8) {
      const mx = x + Math.round(between(rng, -1, 2))
      for (const [dx, dy] of [[0, 0], [1, -1], [2, 0], [3, -1], [4, 0]]) pix.set(mx + dx, y + dy, shade)
      if (rng() < 0.3) pix.set(mx + 6, y - 2, shine)
    }
}

interface FlowerColors {
  petals: Color
  shade: Color
  center: Color
}

/** Margarita de 5×5 con tallo: pétalos en estrella, los de abajo a la derecha en sombra */
export function daisy(pix: Pixmap, x: number, y: number, colors: FlowerColors, stem: Color) {
  pix.rect(x, y + 2, 1, 3, stem)
  for (const [dx, dy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [0, -2], [-2, 0]]) pix.set(x + dx, y + dy, colors.petals)
  for (const [dx, dy] of [[2, 0], [0, 2], [1, 1]]) pix.set(x + dx, y + dy, colors.shade)
  pix.set(x, y, colors.center)
}

/** Flor de cinco píxeles: cruz de pétalos con el centro de otro color */
function flower(pix: Pixmap, x: number, y: number, petals: Color, center: Color) {
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) pix.set(x + dx, y + dy, petals)
  pix.set(x, y, center)
}

/** Fotogramas de una tira de matas que se repite cada `width` píxeles */
export function tuftFrames(width: number, height: number, tufts: readonly Tuft[], style: TuftStyle, frames: number): Pixmap[] {
  return Array.from({ length: frames }, (_, f) => {
    const pix = new Pixmap(width, height)
    for (const tuft of tufts) paintTuft(pix, tuft, (2 * Math.PI * f) / frames, style)
    return pix
  })
}
