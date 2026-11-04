// Caminito de arena de cada casa: escalón de piedra bajo la puerta y bajada hasta la calle.

import type { Pixmap } from '../../paint/pixmap'
import { MORTAR, PAVING, SAND, SAND_INK } from './palette'

/** Escalón de piedra bajo la puerta y caminito de arena que baja hasta la calle (`endY`), abriéndose un poco */
export function walkway(pix: Pixmap, cx: number, doorY: number, halfWidth: number, endY: number) {
  for (let y = doorY + 2; y <= endY; y++) {
    const k = (y - doorY) / Math.max(1, endY - doorY)
    const half = Math.round(halfWidth * (1 + k * 0.6))
    const left = Math.round(cx - half)
    const right = Math.round(cx + half)
    pix.rect(left, y, right - left, 1, SAND[1])
    pix.set(left, y, SAND_INK)
    pix.set(right - 1, y, SAND[0])
  }
  const step = Math.round(halfWidth) + 2
  pix.rect(Math.round(cx - step), doorY, step * 2, 2, PAVING[2])
  pix.rect(Math.round(cx - step), doorY + 1, step * 2, 1, PAVING[0])
  pix.rect(Math.round(cx - step), doorY + 2, step * 2, 1, MORTAR)
}
