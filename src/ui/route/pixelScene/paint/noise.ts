// Azar reproducible por semilla y ruido periódico (se repite cada `period` píxeles en X, para teselas sin costura).

export type Rng = () => number

/** Generador mulberry32: misma semilla, mismo paisaje */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const between = (rng: Rng, min: number, max: number) => min + rng() * (max - min)
export const pick = <T>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length)]

/** Valor fijo en [0, 1) para una celda entera */
export function hash(x: number, y: number, seed: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 2147483647)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

const smooth = (t: number) => t * t * (3 - 2 * t)

/** Ruido de valor suave con celdas de `cell` px que se repite cada `period` px en X (period múltiplo de cell) */
export function valueNoise(x: number, y: number, cell: number, period: number, seed: number): number {
  const cols = Math.max(1, Math.round(period / cell))
  const gx = x / cell
  const gy = y / cell
  const x0 = Math.floor(gx)
  const y0 = Math.floor(gy)
  const tx = smooth(gx - x0)
  const ty = smooth(gy - y0)
  const at = (cx: number, cy: number) => hash(((cx % cols) + cols) % cols, cy, seed)
  const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * tx
  const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * tx
  return top + (bottom - top) * ty
}

/** Suma de senos con un número entero de ciclos por tesela: perfil de colinas sin costura */
/** Pendiente de `periodicWave` en `x` (unidades de altura por píxel) */
export function periodicWaveSlope(x: number, period: number, waves: readonly [cycles: number, amp: number, phase: number][]) {
  return waves.reduce((sum, [cycles, amp, phase]) => {
    const k = (2 * Math.PI * cycles) / period
    return sum + amp * k * Math.cos(k * x + phase)
  }, 0)
}

export function periodicWave(x: number, period: number, waves: readonly [cycles: number, amp: number, phase: number][]) {
  return waves.reduce((sum, [cycles, amp, phase]) => sum + amp * Math.sin((2 * Math.PI * cycles * x) / period + phase), 0)
}
