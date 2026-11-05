// Farola de hierro con farol de cristal encendido: base ancha, poste fino, brazo del farol y remate. El halo de luz
// solo se pinta donde no hay nada (deja ver lo de detrás, semitransparente).

import { TRANSPARENT, type Color, type Pixmap } from '../paint/pixmap'

export interface LampPalette {
  /** Hierro: contorno, sombra, base y luz */
  iron: readonly Color[]
  /** Cristal encendido: borde, base y centro */
  light: readonly Color[]
  /** Halo alrededor del farol (color semitransparente) */
  glow: Color
}

/** Medidas en píxeles de arte: alto total, ancho del farol, alto del farol, radio del halo */
const LAMP = { height: 40, lantern: 7, lanternHeight: 8, glow: 10 }

/** Columna de hierro de `width` píxeles con canto claro a la izquierda y contorno a la derecha */
function ironColumn(pix: Pixmap, x: number, y: number, width: number, height: number, iron: readonly Color[]) {
  pix.rect(x, y, width, height, iron[2])
  pix.rect(x, y, 1, height, iron[3])
  if (width > 2) pix.rect(x + width - 2, y, 1, height, iron[1])
  pix.rect(x + width - 1, y, 1, height, iron[0])
}

function glow(pix: Pixmap, cx: number, cy: number, color: Color) {
  for (let y = cy - LAMP.glow; y <= cy + LAMP.glow; y++)
    for (let x = cx - LAMP.glow; x <= cx + LAMP.glow; x++)
      if (Math.hypot(x - cx, y - cy) <= LAMP.glow && pix.get(x, y) === TRANSPARENT) pix.set(x, y, color)
}

/** Farola con el pie en (`cx`, `groundY`) */
export function lamppost(pix: Pixmap, cx: number, groundY: number, p: LampPalette) {
  const top = groundY - LAMP.height
  const half = Math.floor(LAMP.lantern / 2)
  ironColumn(pix, cx - 3, groundY - 4, 6, 4, p.iron)
  pix.rect(cx - 4, groundY - 1, 8, 1, p.iron[0])
  ironColumn(pix, cx - 1, top + LAMP.lanternHeight + 2, 3, LAMP.height - LAMP.lanternHeight - 6, p.iron)
  ironColumn(pix, cx - 2, top + LAMP.lanternHeight + 1, 5, 2, p.iron)
  const lx = cx - half
  const ly = top + 2
  pix.rect(lx, ly, LAMP.lantern, LAMP.lanternHeight - 1, p.light[1])
  pix.rect(lx + 2, ly + 1, LAMP.lantern - 4, LAMP.lanternHeight - 3, p.light[2])
  pix.rect(lx + LAMP.lantern - 1, ly, 1, LAMP.lanternHeight - 1, p.light[0])
  pix.rect(lx, ly + LAMP.lanternHeight - 2, LAMP.lantern, 1, p.light[0])
  pix.rect(cx, ly, 1, LAMP.lanternHeight - 1, p.iron[2])
  pix.rect(lx - 1, ly - 1, LAMP.lantern + 2, 1, p.iron[2])
  pix.rect(lx, ly - 2, LAMP.lantern, 1, p.iron[3])
  pix.rect(cx - 1, ly - 3, 2, 1, p.iron[2])
  pix.rect(lx + LAMP.lantern, ly - 1, 1, LAMP.lanternHeight, p.iron[0])
  pix.rect(lx - 1, ly + LAMP.lanternHeight - 1, LAMP.lantern + 2, 1, p.iron[1])
  glow(pix, cx, ly + Math.floor(LAMP.lanternHeight / 2), p.glow)
}
