// Partículas del prado: mariposas que revolotean sobre la hierba y algún pétalo llevado por el viento.

import type { ParticleSystem } from '../../engine/types'
import { between, makeRng, pick, type Rng } from '../../paint/noise'

const BUTTERFLY_COLORS = ['#f8f8f0', '#f4d040', '#f0a0c8']
const PETAL_COLORS = ['#ffffff', '#f8d8e8', '#f4cc3a']
const BUTTERFLIES = 3
const PETALS = 8
/** Las mariposas vuelan entre estas alturas sobre el borde inferior, en píxeles de arte */
const FLIGHT_BAND = [70, 115] as const
/** Viento que arrastra los pétalos hacia la izquierda, en píxeles de arte por segundo */
const WIND = 6

interface Mote {
  x: number
  y: number
  vx: number
  t: number
  color: string
}

export function meadowParticles(seed: number): ParticleSystem {
  const rng = makeRng(seed + 10)
  const butterflies: Mote[] = []
  const petals: Mote[] = []
  let ready = false

  const spawnButterfly = (b: Mote, x: number, height: number) => {
    Object.assign(b, { x, y: height - between(rng, ...FLIGHT_BAND), vx: between(rng, -6, 6), t: rng() * 10 })
  }
  const spawnPetal = (p: Mote, x: number, height: number) => {
    Object.assign(p, { x, y: between(rng, 0, height * 0.6), vx: between(rng, 0.5, 1.5), t: rng() * 10 })
  }

  return {
    update(dt, pathSpeed, width, height) {
      if (!ready) {
        for (let i = 0; i < BUTTERFLIES; i++) butterflies.push(mote(rng, BUTTERFLY_COLORS))
        for (let i = 0; i < PETALS; i++) petals.push(mote(rng, PETAL_COLORS))
        butterflies.forEach((b) => spawnButterfly(b, rng() * width, height))
        petals.forEach((p) => spawnPetal(p, rng() * width, height))
        ready = true
      }
      for (const b of butterflies) {
        b.t += dt
        b.vx = Math.max(-10, Math.min(10, b.vx + between(rng, -30, 30) * dt))
        b.x += (b.vx - pathSpeed * 0.7) * dt
        b.y += Math.sin(b.t * 3) * 6 * dt
        if (b.x < -4) spawnButterfly(b, width + 4, height)
        if (b.x > width + 4) spawnButterfly(b, -4, height)
      }
      for (const p of petals) {
        p.t += dt
        p.x -= (WIND * p.vx + pathSpeed * 0.8) * dt - Math.sin(p.t * 2) * 0.15
        p.y += 4 * p.vx * dt
        if (p.x < -2 || p.y > height) spawnPetal(p, width + between(rng, 0, 40), height)
      }
    },
    draw(ctx) {
      for (const b of butterflies) {
        const x = Math.round(b.x)
        const y = Math.round(b.y)
        const open = Math.floor(b.t * 9) % 2 === 0
        ctx.fillStyle = b.color
        ctx.fillRect(x - 1, y - 1, 1, open ? 2 : 1)
        ctx.fillRect(x + 1, y - 1, 1, open ? 2 : 1)
        ctx.fillStyle = '#3a2a1a'
        ctx.fillRect(x, y - 1, 1, 2)
      }
      for (const p of petals) {
        ctx.fillStyle = p.color
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1)
      }
    },
  }
}

const mote = (rng: Rng, colors: readonly string[]): Mote => ({ x: 0, y: 0, vx: 0, t: 0, color: pick(rng, colors) })
