// Fuente de plaza vista de frente: pilón de piedra con agua, columna central, taza de arriba y chorros.

import { Pixmap, type Color } from '../paint/pixmap'

export interface FountainPalette {
  /** Piedra: sombra, base y luz */
  stone: readonly Color[]
  stoneInk: Color
  /** Agua: profunda, base y brillo */
  water: readonly Color[]
}

/** Medidas en píxeles de arte */
const SIZE = { width: 52, height: 42, basin: 12, pillar: 6, bowl: 22 }

function stoneBlock(pix: Pixmap, x: number, y: number, w: number, h: number, p: FountainPalette) {
  pix.rect(x, y, w, h, p.stone[1])
  pix.rect(x, y, w, 1, p.stone[2])
  pix.rect(x, y + h - 2, w, 2, p.stone[0])
  pix.rect(x + w - 2, y, 2, h, p.stone[0])
  pix.rect(x - 1, y - 1, w + 2, 1, p.stoneInk)
  pix.rect(x - 1, y + h, w + 2, 1, p.stoneInk)
  pix.rect(x - 1, y, 1, h, p.stoneInk)
  pix.rect(x + w, y, 1, h, p.stoneInk)
}

/** Chorro que cae en arco desde (x, y) hacia un lado hasta la altura `toY` */
function spout(pix: Pixmap, x: number, y: number, side: number, toY: number, p: FountainPalette) {
  for (let i = 0; y + i * i * 0.12 < toY; i++) {
    const py = y + i * i * 0.12
    pix.set(x + side * i, py, p.water[1])
    pix.set(x + side * i, py + 1, p.water[2])
  }
}

export function fountain(p: FountainPalette): Pixmap {
  const pix = new Pixmap(SIZE.width, SIZE.height, false)
  const cx = SIZE.width / 2
  const basinTop = SIZE.height - SIZE.basin
  const bowlTop = 8
  stoneBlock(pix, cx - SIZE.pillar / 2, bowlTop + 4, SIZE.pillar, basinTop - bowlTop - 4, p)
  stoneBlock(pix, cx - SIZE.bowl / 2, bowlTop, SIZE.bowl, 4, p)
  pix.rect(cx - SIZE.bowl / 2 + 2, bowlTop - 1, SIZE.bowl - 4, 1, p.water[2])
  pix.rect(cx - 1, 1, 2, bowlTop - 2, p.water[1])
  pix.set(cx - 1, 0, p.water[2])
  for (const side of [-1, 1]) spout(pix, cx + side * (SIZE.bowl / 2), bowlTop + 1, side, basinTop + 2, p)
  stoneBlock(pix, 2, basinTop + 2, SIZE.width - 4, SIZE.basin - 3, p)
  pix.rect(3, basinTop + 1, SIZE.width - 6, 2, p.water[0])
  pix.rect(3, basinTop, SIZE.width - 6, 1, p.water[1])
  for (let x = 6; x < SIZE.width - 6; x += 7) pix.set(x, basinTop, p.water[2])
  for (let x = 2 + 9; x < SIZE.width - 4; x += 10) pix.rect(x, basinTop + 4, 1, SIZE.basin - 6, p.stone[0])
  return pix
}
