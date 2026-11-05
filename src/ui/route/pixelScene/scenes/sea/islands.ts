// Lo que asoma del mar: islotes de arena con hierba y palmeras en el horizonte, y rocas con espuma a media
// distancia. Todo apoyado en la línea del agua, con un poco de espuma alrededor para que no corte en seco.

import { boulder } from '../../elements/rocks'
import { paintFoliage } from '../../paint/foliage'
import { between, makeRng, type Rng } from '../../paint/noise'
import { Pixmap } from '../../paint/pixmap'
import type { Sphere } from '../../paint/spheres'
import { FOAM, ISLE_GRASS, PALM, PALM_TRUNK, SAND, SEA_ROCK } from './palette'

/** Palmera de tronco curvado hacia la derecha y copa de pocas hojas grandes */
function palm(pix: Pixmap, rng: Rng, x: number, groundY: number, height: number) {
  const bend = between(rng, 0.15, 0.35)
  let top = { x, y: groundY }
  for (let i = 0; i < height; i++) {
    const px = Math.round(x + bend * i * (i / height) * 1.5)
    const y = groundY - i
    pix.set(px, y, PALM_TRUNK[2])
    pix.set(px + 1, y, i % 3 === 0 ? PALM_TRUNK[0] : PALM_TRUNK[1])
    top = { x: px, y }
  }
  const spheres: Sphere[] = []
  for (const [dx, dy, r] of [[-5, 2, 3], [5, 2, 3], [-2, -1, 3.5], [3, -1, 3], [0, 1, 2.5], [-8, 4, 2], [8, 4, 2]] as const)
    spheres.push({ x: top.x + dx * (height / 14), y: top.y + dy * (height / 14), r: r * (height / 14), tone: dy > 2 ? -0.2 : 0.1 })
  paintFoliage(pix, spheres, PALM.colors, { seed: Math.floor(rng() * 1e6), ink: PALM.ink, jitter: 0.6, texture: 0.1, gaps: false })
}

/** Islote: loma de arena con hierba arriba, una o dos palmeras y espuma en la orilla */
function islet(pix: Pixmap, rng: Rng, cx: number, waterY: number, width: number, height: number) {
  const half = width / 2
  for (let x = Math.round(cx - half); x <= cx + half; x++) {
    const u = (x - cx) / half
    const h = Math.round(height * Math.sqrt(Math.max(0, 1 - u * u)))
    for (let y = waterY - h; y <= waterY; y++) {
      const fromTop = y - (waterY - h)
      const grass = fromTop < h * 0.45 && Math.abs(u) < 0.75
      const tone = u < -0.3 ? 2 : u > 0.4 ? 0 : 1
      pix.set(x, y, grass ? ISLE_GRASS[tone] : SAND[tone])
    }
    pix.set(x, waterY + 1, FOAM[1])
  }
  const palms = width > 40 ? 2 : 1
  for (let i = 0; i < palms; i++) palm(pix, rng, cx + (i - (palms - 1) / 2) * width * 0.3, waterY - height + 2, Math.round(height * between(rng, 1.0, 1.3)))
}

/** Islotes lejanos en el horizonte, pocos y de tamaños distintos */
export function islands(seed: number): Pixmap {
  const rng = makeRng(seed + 5)
  const pix = new Pixmap(640, 40)
  const waterY = pix.h - 2
  islet(pix, rng, 120, waterY, 56, 9)
  islet(pix, rng, 190, waterY, 22, 5)
  islet(pix, rng, 460, waterY, 40, 7)
  return pix
}

/** Rocas que asoman del agua a media distancia, con espuma a su alrededor */
export function seaRocks(seed: number): Pixmap {
  const rng = makeRng(seed + 6)
  const pix = new Pixmap(560, 40)
  const waterY = pix.h - 4
  for (const x of [70, 96, 330]) {
    const size = Math.round(between(rng, 7, 12))
    boulder(pix, rng, x + between(rng, -10, 10), waterY, size, SEA_ROCK)
    for (let k = -size * 1.3; k < size * 1.3; k++) pix.set(Math.round(x + k), waterY + 1 + (Math.abs(k) > size ? 1 : 0), FOAM[1])
  }
  return pix
}
