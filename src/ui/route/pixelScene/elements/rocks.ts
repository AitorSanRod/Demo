// Piezas de cueva: estalactitas y estalagmitas redondeadas, peñascos de varias bolas, racimos de cristales que
// brillan y masas de roca de fondo. Luz arriba a la izquierda; contorno solo en el lado de sombra.

import { between, periodicWave, valueNoise, type Rng } from '../paint/noise'
import { Pixmap, TRANSPARENT, type Color } from '../paint/pixmap'
import { ramp } from '../paint/shade'
import { paintSpheres, type Sphere } from '../paint/spheres'
import type { Inked } from './trees'

/** Tono de una columna de roca según dónde cae (`u` de 0 a 1, de izquierda a derecha): luz, base o sombra */
const sideTone = (u: number, colors: readonly Color[]) => (u < 0.3 ? colors[3] : u > 0.68 ? colors[1] : colors[2])

/**
 * Pincho de roca que se estrecha hasta una punta redondeada: cuelga del techo (`down`) o sale del suelo. `x, y` es el
 * centro de su base. `rock.colors`: hueco, sombra, base, luz y brillo.
 */
export function spike(pix: Pixmap, x: number, y: number, length: number, width: number, rock: Inked, down: boolean) {
  for (let i = 0; i < length; i++) {
    const t = i / length
    const half = Math.max(0.5, (width / 2) * Math.pow(1 - t, 0.7))
    const left = Math.round(x - half)
    const right = Math.round(x + half)
    const py = down ? y + i : y - i
    for (let px = left; px < right; px++) pix.set(px, py, sideTone((px - left + 0.5) / (right - left), rock.colors))
    if (right - left > 2 && i % 5 === 2) pix.set(left + 1, py, rock.colors[4])
    pix.set(right, py, rock.ink)
  }
  pix.set(Math.round(x), down ? y + length : y - length, rock.ink)
}

/** Peñasco de varias bolas apoyado en el suelo, de `size` píxeles de alto aproximado */
export function boulder(pix: Pixmap, rng: Rng, cx: number, groundY: number, size: number, rock: Inked) {
  const count = 2 + Math.floor(rng() * 2)
  const spheres: Sphere[] = [{ x: cx, y: groundY - size * 0.45, r: size * 0.6, z: 1 }]
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1
    spheres.push({ x: cx + side * size * between(rng, 0.45, 0.75), y: groundY - size * 0.15, r: size * between(rng, 0.35, 0.5), tone: between(rng, -0.25, 0) })
  }
  const w = Math.ceil(size * 3.2)
  const local = new Pixmap(w, Math.ceil(size * 1.3) + 1, false)
  const dx = w / 2 - cx
  const dy = local.h - 1 - groundY
  paintSpheres(local, spheres.map((s) => ({ ...s, x: s.x + dx, y: s.y + dy })), rock.colors, { floorY: local.h - 1, floorShade: 0.3, outline: rock.ink, lines: rock.ink })
  pix.stamp(local, Math.round(cx - w / 2), Math.round(groundY - local.h + 1))
}

/** Cristales: borde, base, luz y brillo, y el halo semitransparente */
export interface CrystalPalette {
  colors: readonly Color[]
  glow: Color
}

/** Radio del halo de los cristales, en píxeles de arte, por cada píxel de alto del cristal más grande */
const GLOW_PER_HEIGHT = 0.9

/** Prisma de cristal inclinado (`lean` píxeles por fila) con punta, cara izquierda clara y canto brillante */
function prism(pix: Pixmap, x: number, groundY: number, height: number, width: number, lean: number, p: CrystalPalette) {
  const [ink, base, light, shine] = p.colors
  for (let i = 0; i < height; i++) {
    const tip = Math.max(0, i - (height - width))
    const left = Math.round(x + lean * i + tip / 2)
    const w = Math.max(1, width - tip)
    for (let k = 0; k < w; k++) pix.set(left + k, groundY - i, k === 0 ? shine : k < w / 2 ? light : base)
    pix.set(left + w, groundY - i, ink)
  }
}

/** Racimo de 3 a 5 cristales que salen del suelo en abanico, con halo de luz alrededor (solo sobre lo vacío) */
export function crystals(pix: Pixmap, rng: Rng, cx: number, groundY: number, size: number, p: CrystalPalette) {
  const count = 3 + Math.floor(rng() * 3)
  const glowR = size * GLOW_PER_HEIGHT
  const cy = groundY - size / 2
  for (let y = Math.round(cy - glowR); y <= cy + glowR; y++)
    for (let x = Math.round(cx - glowR); x <= cx + glowR; x++)
      if (Math.hypot(x - cx, y - cy) <= glowR && pix.get(x, y) === TRANSPARENT) pix.set(x, y, p.glow)
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const lean = (t - 0.5) * 0.6
    const height = Math.round(size * (1 - Math.abs(t - 0.5)) * between(rng, 0.7, 1))
    prism(pix, cx + (t - 0.5) * size * 0.5, groundY, Math.max(4, height), Math.max(2, Math.round(size / 6)), lean, p)
  }
}

type Waves = readonly [cycles: number, amp: number, phase: number][]

/**
 * Masa de roca sin contorno con el perfil de `waves` (altura media `base` sobre el borde de abajo): las caras que
 * miran a la izquierda, a la luz, más claras; canto claro arriba; más oscura hacia abajo y con manchas suaves.
 * `colors`: de oscuro a claro.
 */
export function rockMass(pix: Pixmap, base: number, waves: Waves, colors: readonly Color[], seed: number) {
  const height = (x: number) => periodicWave(x, pix.w, waves)
  for (let x = 0; x < pix.w; x++) {
    const top = Math.round(pix.h - base - height(x))
    const facing = height(x + 2) - height(x - 2)
    for (let y = Math.max(0, top); y < pix.h; y++) {
      const depth = y - top
      const patches = (valueNoise(x, y * 1.5, 24, pix.w, seed) - 0.5) * 0.15
      const t = 0.5 + Math.max(-0.3, Math.min(0.3, facing * 0.2)) + (depth < 2 ? 0.25 : 0) - (depth / pix.h) * 0.45 + patches
      pix.set(x, y, ramp(colors, t, x, y, 0))
    }
  }
}
