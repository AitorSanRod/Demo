// Cartel de madera con texto en una fuente de 3×5 píxeles (solo los caracteres que usan los carteles).

import { Pixmap, type Color } from '../paint/pixmap'

const GLYPHS: Record<string, string[]> = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  B: ['##.', '#.#', '##.', '#.#', '##.'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'],
  L: ['#..', '#..', '#..', '#..', '###'],
  O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  P: ['##.', '#.#', '##.', '#..', '#..'],
  Q: ['.#.', '#.#', '#.#', '##.', '.##'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '###'],
  V: ['#.#', '#.#', '#.#', '#.#', '.#.'],
  1: ['.#.', '##.', '.#.', '.#.', '###'],
  2: ['##.', '..#', '.#.', '#..', '###'],
  ' ': ['.', '.', '.', '.', '.'],
}

function textWidth(text: string): number {
  return [...text].reduce((w, ch) => w + GLYPHS[ch][0].length + 1, -1)
}

function paintText(pix: Pixmap, text: string, x: number, y: number, color: Color) {
  let cx = x
  for (const ch of text) {
    const glyph = GLYPHS[ch]
    glyph.forEach((row, gy) => [...row].forEach((cell, gx) => cell === '#' && pix.set(cx + gx, y + gy, color)))
    cx += glyph[0].length + 1
  }
}

/** `wood`: rampa de 5 tonos de madera (oscuro → claro); `grass`: color de las matas de la base */
export function signpost(text: string, wood: readonly Color[], grass: readonly Color[]): Pixmap {
  const boardW = textWidth(text) + 8
  const boardH = 11
  const postH = 12
  const pix = new Pixmap(boardW + 2, boardH + postH + 1, false)
  const posts = [Math.round(boardW * 0.22), Math.round(boardW * 0.78) - 1]
  for (const px of posts) {
    pix.rect(px, boardH, 1, postH, wood[3])
    pix.rect(px + 1, boardH, 1, postH, wood[1])
    pix.rect(px, boardH, 2, 1, wood[0])
  }
  pix.rect(1, 0, boardW, boardH, wood[0])
  pix.rect(2, 1, boardW - 2, boardH - 2, wood[3])
  pix.rect(2, 1, boardW - 2, 1, wood[4])
  pix.rect(2, boardH - 2, boardW - 2, 1, wood[2])
  pix.rect(boardW - 1, 1, 1, boardH - 2, wood[2])
  paintText(pix, text, 5, 3, wood[0])
  const baseY = pix.h - 1
  for (const px of posts)
    for (const [dx, dy, c] of [[-1, 0, 2], [2, 0, 1], [-2, 0, 3], [3, 0, 2], [0, -1, 3], [2, -1, 2]] as const)
      pix.set(px + dx, baseY + dy, grass[c])
  return pix
}
