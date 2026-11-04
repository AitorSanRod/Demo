// Valla blanca de estacas y parterres de flores, para los jardines del pueblo.

import type { Rng } from '../paint/noise'
import type { Color, Pixmap } from '../paint/pixmap'

/** `colors`: sombra, base y luz; `ink`, contorno */
export interface Painted {
  colors: readonly Color[]
  ink: Color
}

/** Medidas de la valla en píxeles de arte */
const PICKET = { gap: 6, width: 3, height: 12, rails: [4, 9] }

/** Poste de los extremos: más ancho y alto que las estacas, con remate redondeado */
const END_POST = { width: 5, extra: 3 }

function endPost(pix: Pixmap, x: number, baseY: number, paint: Painted) {
  const [shade, base, light] = paint.colors
  const top = baseY - PICKET.height - END_POST.extra
  pix.rect(x, top + 2, END_POST.width, baseY - top - 2, base)
  pix.rect(x, top + 2, 1, baseY - top - 2, light)
  pix.rect(x + END_POST.width - 1, top + 2, 1, baseY - top - 2, shade)
  pix.rect(x - 1, top + 1, END_POST.width + 2, 2, light)
  pix.rect(x - 1, top + 3, END_POST.width + 2, 1, shade)
  pix.rect(x, top, END_POST.width, 1, paint.ink)
  pix.set(x - 1, top + 1, paint.ink)
  pix.set(x + END_POST.width, top + 1, paint.ink)
  pix.rect(x + END_POST.width, top + 4, 1, baseY - top - 4, paint.ink)
}

/** Valla de estacas con punta y dos travesaños, de `x` a `x + width`, apoyada en `baseY`, con un poste en cada extremo */
export function picketFence(pix: Pixmap, x: number, width: number, baseY: number, paint: Painted) {
  const [shade, base, light] = paint.colors
  for (const railY of PICKET.rails) {
    pix.rect(x, baseY - railY - 1, width, 2, shade)
    pix.rect(x, baseY - railY - 2, width, 1, paint.ink)
  }
  const last = x + width - END_POST.width
  for (let px = x + END_POST.width + 2; px <= last - PICKET.width - 1; px += PICKET.gap) {
    const top = baseY - PICKET.height
    pix.rect(px, top + 1, PICKET.width, PICKET.height - 1, base)
    pix.rect(px, top + 1, 1, PICKET.height - 1, light)
    pix.set(px + 1, top, base)
    pix.rect(px + PICKET.width, top + 1, 1, PICKET.height - 1, paint.ink)
    pix.set(px - 1, top + 1, paint.ink)
    pix.set(px + 1, top - 1, paint.ink)
  }
  endPost(pix, x, baseY, paint)
  endPost(pix, last, baseY, paint)
}

/** Medidas del parterre en píxeles de arte: tierra, separación entre flores y altura de los tallos */
const BED = { soil: 5, spacing: 4, stem: [8, 13] }

/**
 * Parterre: franja de tierra con flores de tallo alto (asoman por encima de la valla), cada flor de 2×2 con brillo.
 * `stem`: color de los tallos; `flowers`: pares [pétalo, brillo].
 */
export function flowerBed(pix: Pixmap, rng: Rng, x: number, width: number, baseY: number, soil: Painted, stem: Color, flowers: readonly Color[][]) {
  pix.rect(x, baseY - BED.soil, width, BED.soil, soil.colors[1])
  pix.rect(x, baseY - BED.soil, width, 1, soil.colors[2])
  pix.rect(x, baseY - 1, width, 1, soil.ink)
  for (let fx = x + 2; fx < x + width - 2; fx += BED.spacing) {
    const [petal, shine] = flowers[Math.floor(rng() * flowers.length)]
    const top = baseY - BED.soil - Math.round(BED.stem[0] + rng() * (BED.stem[1] - BED.stem[0]))
    pix.rect(fx, top + 2, 1, baseY - BED.soil - top - 2, stem)
    pix.rect(fx - 1, top, 2, 2, petal)
    pix.set(fx - 1, top, shine)
  }
}
