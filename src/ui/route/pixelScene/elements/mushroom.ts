// Seta de sombrero redondo con motas, para el sotobosque.

import type { Color, Pixmap } from '../paint/pixmap'

interface MushroomPalette {
  /** Sombrero: sombra, base y luz */
  cap: readonly Color[]
  capInk: Color
  spots: Color
  /** Pie: sombra y base */
  stem: readonly Color[]
}

/** Seta con la base en (x, baseY); `size` es el radio del sombrero en píxeles de arte */
export function mushroom(pix: Pixmap, x: number, baseY: number, size: number, p: MushroomPalette) {
  const stemHeight = Math.max(2, Math.round(size * 0.9))
  const stemHalf = Math.max(1, Math.round(size * 0.35))
  pix.rect(x - stemHalf, baseY - stemHeight, stemHalf * 2, stemHeight, p.stem[1])
  pix.rect(x + stemHalf - 1, baseY - stemHeight, 1, stemHeight, p.stem[0])
  const capY = baseY - stemHeight
  for (let dy = -size; dy <= 0; dy++)
    for (let dx = -size; dx <= size; dx++) {
      if (dx * dx + dy * dy * 2 > size * size) continue
      const edge = dx * dx + (dy - 1) * (dy - 1) * 2 > size * size || dy === 0
      const tone = dx < -size * 0.3 && dy < -size * 0.3 ? 2 : dx > size * 0.4 || dy === 0 ? 0 : 1
      pix.set(x + dx, capY + dy, edge ? p.capInk : p.cap[tone])
    }
  if (size >= 3) {
    pix.set(x - 1, capY - size * 0.5, p.spots)
    pix.set(x + Math.round(size * 0.4), capY - 1 - Math.round(size * 0.2), p.spots)
  }
}
