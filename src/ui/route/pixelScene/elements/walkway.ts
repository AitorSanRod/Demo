// Caminito de cada casa: escalón de piedra bajo la puerta y bajada hasta la calle.

import type { Color, Pixmap } from '../paint/pixmap'

export interface WalkwayPalette {
  /** Suelo del caminito: sombra, base y contorno del lado izquierdo */
  fill: Color
  shade: Color
  ink: Color
  /** Escalón: piedra (sombra, base y luz) y junta de abajo */
  step: readonly Color[]
  mortar: Color
}

/** Escalón de piedra bajo la puerta y caminito que baja hasta la calle (`endY`), abriéndose un poco */
export function walkway(pix: Pixmap, cx: number, doorY: number, halfWidth: number, endY: number, p: WalkwayPalette) {
  for (let y = doorY + 2; y <= endY; y++) {
    const k = (y - doorY) / Math.max(1, endY - doorY)
    const half = Math.round(halfWidth * (1 + k * 0.6))
    const left = Math.round(cx - half)
    const right = Math.round(cx + half)
    pix.rect(left, y, right - left, 1, p.fill)
    pix.set(left, y, p.ink)
    pix.set(right - 1, y, p.shade)
  }
  const step = Math.round(halfWidth) + 2
  pix.rect(Math.round(cx - step), doorY, step * 2, 2, p.step[2])
  pix.rect(Math.round(cx - step), doorY + 1, step * 2, 1, p.step[0])
  pix.rect(Math.round(cx - step), doorY + 2, step * 2, 1, p.mortar)
}
