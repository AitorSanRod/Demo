// Tronco caído y hueco visto de lado: cilindro con vetas, musgo por encima y la boca hueca a la izquierda.

import { hash } from '../paint/noise'
import { Pixmap, type Color } from '../paint/pixmap'

export interface LogPalette {
  /** Corteza: oscuro, sombra, base y luz */
  bark: readonly Color[]
  barkInk: Color
  /** Corte de la madera: anillo oscuro y madera clara */
  rings: readonly Color[]
  hollow: Color
  /** Musgo: sombra, base y luz */
  moss: readonly Color[]
}

/** Medidas en píxeles de arte */
const SIZE = { width: 76, height: 26, mouth: 7 }

const inEllipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1

export function hollowLog(p: LogPalette): Pixmap {
  const pix = new Pixmap(SIZE.width, SIZE.height + 1, false)
  const cy = SIZE.height / 2
  const ry = SIZE.height / 2 - 1
  const endX = SIZE.mouth + 1
  for (let x = endX; x < SIZE.width - 2; x++)
    for (let y = 1; y < SIZE.height - 1; y++) {
      const v = (y - 1) / (SIZE.height - 2)
      const streak = hash(x >> 2, y, 7) < 0.25 ? -1 : 0
      const tone = Math.max(0, (v < 0.25 ? 3 : v < 0.6 ? 2 : v < 0.85 ? 1 : 0) + streak)
      pix.set(x, y, p.bark[tone])
    }
  pix.rect(endX, 0, SIZE.width - endX - 2, 1, p.barkInk)
  pix.rect(endX, SIZE.height - 1, SIZE.width - endX - 2, 1, p.barkInk)
  for (let y = 1; y < SIZE.height - 1; y++) for (const dx of [-2, -1]) if (inEllipse(SIZE.width + dx, y, SIZE.width - 3, cy, 3, ry)) pix.set(SIZE.width + dx, y, p.bark[1])
  pix.rect(SIZE.width - 1, 3, 1, SIZE.height - 6, p.barkInk)
  for (let y = 0; y < SIZE.height; y++)
    for (let x = 0; x <= endX + 1; x++) {
      if (!inEllipse(x, y, endX, cy, SIZE.mouth, ry + 0.5)) continue
      const hole = inEllipse(x, y, endX, cy, SIZE.mouth * 0.55, ry * 0.6)
      const ring = !hole && !inEllipse(x, y, endX, cy, SIZE.mouth * 0.8, ry * 0.85)
      pix.set(x, y, hole ? p.hollow : ring ? p.rings[0] : p.rings[1])
    }
  for (let x = endX + 2; x < SIZE.width - 6; x++) {
    const depth = 1 + Math.floor(hash(x >> 1, 1, 3) * 3)
    for (let k = 0; k < depth; k++) pix.set(x, k, p.moss[k === 0 ? 2 : k === depth - 1 ? 0 : 1])
  }
  return pix
}
