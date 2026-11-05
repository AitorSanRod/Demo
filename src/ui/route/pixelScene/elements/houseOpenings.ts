// Huecos y salientes de la casa: chimenea, puerta y ventanas, con la luz arriba a la izquierda (sombra en el
// hueco bajo el marco de arriba y a la izquierda, y sombra arrojada sobre la pared o el tejado a la derecha).

import type { Pixmap } from '../paint/pixmap'
import type { HousePalette, Measures } from './house'

/** Por debajo de este ancho de ventana (en píxeles de arte) el cristal va sin sombra ni reflejo */
const DETAILED_WINDOW = 6

/** Chimenea de ladrillo con su sombra sobre el tejado */
export function chimney(pix: Pixmap, p: HousePalette, m: Measures) {
  const [cw, ch] = m.chimney
  const cx = m.chimneyX
  pix.rect(cx + cw + 1, 1, 1, ch, p.roof[0])
  pix.rect(cx, 0, cw, ch, p.brick[1])
  pix.rect(cx, 1, 1, ch - 1, p.brick[2])
  pix.rect(cx + cw - 1, 1, 1, ch - 1, p.brick[0])
  pix.rect(cx, 1, cw, 1, p.brick[0])
  pix.rect(cx - 1, 0, cw + 2, 1, p.roofInk)
  pix.rect(cx + cw, 0, 1, ch, p.roofInk)
}

/** Puerta de dos hojas metida en la pared: sombra del dintel arriba, canto iluminado a la izquierda */
export function door(pix: Pixmap, p: HousePalette, m: Measures) {
  const [w, h] = m.door
  const x = Math.round(m.width / 2 - w / 2)
  const top = m.roof + m.wall - 1 - h
  pix.rect(x + w + 1, top, 1, h, p.wall[1])
  pix.rect(x - 1, top - 1, w + 2, h + 1, p.wood[0])
  pix.rect(x, top, w, h, p.wood[1])
  pix.rect(x, top, Math.max(1, Math.round(w / 5)), h, p.wood[2])
  pix.rect(x, top, w, 1, p.wood[0])
  pix.rect(x + Math.floor(w / 2), top, 1, h, p.wood[0])
}

/** Ventana con marco, cruz, alféizar y sombra en la pared; las grandes, con sombra y reflejo en el cristal */
export function windowAt(pix: Pixmap, p: HousePalette, m: Measures, x: number, top: number) {
  const [w, h] = m.window
  pix.rect(x + w + 1, top, 1, h + 1, p.wall[1])
  pix.rect(x - 1, top + h + 2, w + 4, 1, p.wall[1])
  pix.rect(x - 1, top - 1, w + 2, h + 2, p.wood[0])
  pix.rect(x, top, w, h, p.glass[1])
  if (w >= DETAILED_WINDOW) {
    pix.rect(x, top, w, 1, p.glass[0])
    pix.rect(x, top, 1, h, p.glass[0])
    const glint = Math.max(1, Math.round(h / 4))
    for (let i = 0; i < glint + 1; i++) pix.set(x + 2 + glint - i, top + 1 + i, p.glass[2])
  } else pix.set(x + 1, top + 1, p.glass[2])
  pix.rect(x + Math.floor(w / 2), top, 1, h, p.wood[2])
  pix.rect(x, top + Math.floor(h / 2), w, 1, p.wood[2])
  pix.rect(x - 2, top + h + 1, w + 4, 1, p.wood[2])
}
