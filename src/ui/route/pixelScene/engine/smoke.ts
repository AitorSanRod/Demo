// Humo de chimeneas: cada chimenea humea a ratos (unos segundos encendida y un rato largo apagada, cada una a su
// aire). Mientras humea suelta bocanadas que suben, crecen, se las lleva el viento y se desvanecen. Las bocanadas
// viajan con su capa, así que se quedan sobre su chimenea al caminar.

/** Ritmo y forma del humo (tiempos en segundos, distancias en píxeles de arte) */
const SMOKE = { interval: 0.45, life: 4, rise: 5, wind: 2.5, wobble: 0.6, maxRadius: 4.5, alpha: 0.95 }
/** Duración de los ratos con humo y sin él, en segundos: [mín, máx] */
const BURST = { on: [4, 9], off: [10, 26] } as const

interface Schedule {
  smoking: boolean
  /** Segundos que faltan para cambiar de estado */
  left: number
  /** Segundos que faltan para la próxima bocanada */
  next: number
}

const spanOf = ([min, max]: readonly [number, number]) => min + Math.random() * (max - min)
const LIGHT = '#f6f6f6'
const SHADE = '#d4d8e2'

interface Puff {
  layerId: string
  x: number
  /** Altura respecto a la fila de arriba de su capa (así aguanta cambios de tamaño de la pantalla) */
  y: number
  age: number
  seed: number
}

export interface EmitterLayer {
  id: string
  /** Puntos de salida en coordenadas de la tesela */
  emitters: readonly { x: number; y: number }[]
  /** Ancho de la tesela y desplazamiento acumulado */
  tileWidth: number
  scroll: number
}

export class Smoke {
  private puffs: Puff[] = []
  private readonly schedules = new Map<string, Schedule>()

  /** `moved`: píxeles que se ha desplazado cada capa en este paso */
  update(dt: number, layers: readonly EmitterLayer[], moved: (id: string) => number, width: number) {
    for (const puff of this.puffs) {
      puff.age += dt
      puff.x -= moved(puff.layerId) + SMOKE.wind * dt + Math.sin(puff.age * 3 + puff.seed) * SMOKE.wobble * dt
      puff.y -= SMOKE.rise * dt
    }
    this.puffs = this.puffs.filter((p) => p.age < SMOKE.life)
    for (const layer of layers)
      layer.emitters.forEach((e, i) => {
        if (this.tick(`${layer.id}:${i}`, dt)) this.spawn(layer, e, width)
      })
  }

  /** Avanza el horario de una chimenea; devuelve si toca soltar una bocanada */
  private tick(key: string, dt: number): boolean {
    const s = this.schedules.get(key) ?? { smoking: false, left: spanOf(BURST.off) * Math.random(), next: 0 }
    this.schedules.set(key, s)
    s.left -= dt
    if (s.left <= 0) {
      s.smoking = !s.smoking
      s.left = spanOf(s.smoking ? BURST.on : BURST.off)
    }
    if (!s.smoking) return false
    s.next -= dt
    if (s.next > 0) return false
    s.next = SMOKE.interval
    return true
  }

  private spawn(layer: EmitterLayer, e: { x: number; y: number }, width: number) {
    const start = -(((Math.round(layer.scroll) % layer.tileWidth) + layer.tileWidth) % layer.tileWidth)
    for (let tile = start; tile < width; tile += layer.tileWidth) {
      const x = tile + e.x
      if (x > -4 && x < width + 4) this.puffs.push({ layerId: layer.id, x, y: e.y, age: 0, seed: Math.random() * 6 })
    }
  }

  /** Pinta las bocanadas de una capa (cuya fila de arriba está en `top`) como discos de píxeles, con la mitad de abajo en sombra */
  draw(ctx: CanvasRenderingContext2D, layerId: string, top: number) {
    for (const puff of this.puffs) {
      if (puff.layerId !== layerId) continue
      const k = puff.age / SMOKE.life
      const r = 0.8 + k * (SMOKE.maxRadius - 0.8)
      ctx.globalAlpha = SMOKE.alpha * (1 - k)
      for (let dy = -Math.floor(r); dy <= Math.floor(r); dy++) {
        const half = Math.sqrt(Math.max(0, r * r - dy * dy))
        ctx.fillStyle = dy > 0 ? SHADE : LIGHT
        ctx.fillRect(Math.round(puff.x - half), Math.round(top + puff.y + dy), Math.max(1, Math.round(half * 2)), 1)
      }
    }
    ctx.globalAlpha = 1
  }
}
