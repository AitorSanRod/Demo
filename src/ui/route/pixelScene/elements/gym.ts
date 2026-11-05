// Gimnasio de roca: edificio de grandes sillares de piedra de esquinas redondeadas, con un cuerpo central más alto
// sobre la entrada (emblema de roca redondo y dintel de piedra), pretil en la azotea y peñascos junto a la puerta.

import { hash, makeRng } from '../paint/noise'
import { Pixmap, type Color } from '../paint/pixmap'
import { boulder } from './rocks'
import type { Inked } from './trees'

export interface GymPalette {
  /** Sillares: junta, sombra, base, luz y brillo */
  stone: readonly Color[]
  ink: Color
  /** Puerta: oscuro, base y luz */
  door: readonly Color[]
  /** Peñascos de la entrada */
  rocks: Inked
}

/** Medidas a escala 1, en píxeles de arte; `tower` y `towerRise`, ancho y lo que sobresale el cuerpo central */
const BASE = { width: 110, wall: 44, parapet: 5, block: [14, 8], door: [22, 26], tower: 46, towerRise: 14, emblem: 8, rockRoom: 12 }

/** Sillares en hiladas de alto fijo y largo variado (cada hilada, desplazada), con canto claro arriba a la izquierda */
function blocks(pix: Pixmap, p: GymPalette, top: number, height: number, block: number[], seed: number) {
  const [joint, shade, base, light] = p.stone
  for (let row = 0, y = top; y < top + height; row++, y += block[1]) {
    let x = -Math.round(hash(row, 0, seed) * block[0])
    for (let k = 0; x < pix.w; k++) {
      const length = Math.round(block[0] * (0.7 + hash(row, k, seed + 1) * 0.7))
      const tone = hash(row, k, seed + 2) < 0.25 ? shade : base
      for (let yy = y; yy < Math.min(y + block[1], top + height); yy++)
        for (let xx = Math.max(0, x); xx < Math.min(pix.w, x + length); xx++) {
          const corner = (xx === x + 1 || xx === x + length - 1) && (yy === y + 1 || yy === y + block[1] - 1)
          const edge = xx === x || yy === y || corner
          const lit = xx === x + 1 || yy === y + 1
          const dark = xx === x + length - 1 || yy === y + block[1] - 1
          pix.set(xx, yy, edge ? joint : lit ? light : dark ? shade : tone)
        }
      x += length
    }
  }
}

/** Pretil de la azotea: canto brillante arriba, sombra debajo y contorno a la derecha */
function parapetBand(pix: Pixmap, p: GymPalette, x: number, y: number, width: number, height: number) {
  pix.rect(x, y, width, height, p.stone[2])
  pix.rect(x, y, width, 1, p.stone[4])
  pix.rect(x, y + height - 1, width, 1, p.stone[1])
  pix.rect(x, y + height, width, 2, p.stone[0])
  pix.rect(x + width - 1, y, 1, height, p.ink)
}

/** Emblema redondo de roca: disco claro con el canto de sombra abajo a la derecha y un brillo arriba a la izquierda */
function emblem(pix: Pixmap, p: GymPalette, cx: number, cy: number, r: number) {
  for (let y = -r; y <= r; y++)
    for (let x = -r; x <= r; x++) {
      const d = Math.hypot(x, y)
      if (d > r) continue
      const rim = d > r - 1.2
      pix.set(cx + x, cy + y, rim ? (x + y > 0 ? p.ink : p.stone[1]) : x + y < -r * 0.6 ? p.stone[4] : p.stone[3])
    }
}

/** Puerta de dos hojas con dintel de piedra encima */
function entrance(pix: Pixmap, p: GymPalette, cx: number, bottom: number, w: number, h: number) {
  const x = Math.round(cx - w / 2)
  const y = bottom - h
  pix.rect(x - 3, y - 4, w + 6, 4, p.stone[3])
  pix.rect(x - 3, y - 4, w + 6, 1, p.stone[4])
  pix.rect(x - 3, y - 1, w + 6, 1, p.stone[1])
  pix.rect(x + w + 3, y - 4, 1, 4, p.ink)
  pix.rect(x, y, w, h, p.door[1])
  pix.rect(x, y, w, 2, p.door[0])
  pix.rect(x + 1, y + 2, 1, h - 2, p.door[2])
  pix.rect(x + Math.floor(w / 2), y, 1, h, p.door[0])
}

/** Gimnasio a `scale` (1 = 110 píxeles de ancho, más el sitio de los peñascos de los lados) */
export function gym(p: GymPalette, scale = 1, seed = 1): Pixmap {
  const s = (n: number) => Math.max(2, Math.round(n * scale))
  const [width, wall, parapet, rise, tower, room] = [s(BASE.width), s(BASE.wall), s(BASE.parapet), s(BASE.towerRise), s(BASE.tower), s(BASE.rockRoom)]
  const block = [s(BASE.block[0]), s(BASE.block[1])]
  const body = new Pixmap(width, rise + parapet + wall, false)
  blocks(body, p, rise + parapet, wall, block, seed)
  parapetBand(body, p, 0, rise, width, parapet)
  const center = new Pixmap(tower, body.h, false)
  blocks(center, p, parapet, rise + wall, block, seed + 5)
  parapetBand(center, p, 0, 0, tower, parapet)
  center.rect(tower - 1, parapet, 1, rise + wall, p.ink)
  const tx = Math.round(width / 2 - tower / 2)
  body.stamp(center, tx, 0)
  body.rect(tx + tower, rise + parapet + 2, 1, wall - 2, p.stone[0])
  emblem(body, p, Math.round(width / 2), Math.round(parapet + rise * 0.75), s(BASE.emblem))
  body.rect(width - 1, rise, 1, parapet + wall, p.ink)
  body.rect(0, body.h - 1, width, 1, p.ink)
  const [dw, dh] = [s(BASE.door[0]), s(BASE.door[1])]
  entrance(body, p, width / 2, body.h - 1, dw, dh)
  const pix = new Pixmap(width + room * 2, body.h, false)
  pix.stamp(body, room, 0)
  const rng = makeRng(seed + 9)
  const groundY = pix.h - 1
  for (const side of [-1, 1]) boulder(pix, rng, room + width / 2 + side * (dw / 2 + s(14)), groundY, s(13), p.rocks)
  boulder(pix, rng, room + s(2), groundY, s(10), p.rocks)
  boulder(pix, rng, room + width - s(6), groundY, s(7), p.rocks)
  return pix
}
