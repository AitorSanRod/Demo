// Pinta una escena en dos lienzos (detrás y delante del Pokémon) a resolución de arte; el CSS los escala sin suavizado.

import { Smoke } from './smoke'
import type { Landmark, SceneDef, SceneLayer } from './types'

interface ActiveLandmark {
  landmark: Landmark
  image: HTMLCanvasElement
  x: number
}

/** Velocidad del suelo a velocidad ×1, en píxeles de arte por segundo */
const PATH_SPEED = 26
/** Dónde aparece un elemento de parada que sale ya colocado, en fracción del ancho (algo por delante del Pokémon) */
const SETTLED_AT = 0.62

/** Id reservado para mostrar u ocultar las partículas desde los controles */
export const PARTICLES_ID = 'particles'

export class SceneRenderer {
  moving = true
  speed = 1
  readonly hidden = new Set<string>()
  private time = 0
  private width = 0
  private height = 0
  private sky?: HTMLCanvasElement
  private readonly scroll = new Map<string, number>()
  private readonly images = new Map<string, HTMLCanvasElement[]>()
  private readonly landmarkImages = new Map<string, HTMLCanvasElement>()
  private active: ActiveLandmark[] = []
  private readonly smoke = new Smoke()
  private readonly scene: SceneDef
  private readonly back: HTMLCanvasElement
  private readonly front: HTMLCanvasElement

  constructor(scene: SceneDef, back: HTMLCanvasElement, front: HTMLCanvasElement) {
    this.scene = scene
    this.back = back
    this.front = front
    for (const layer of scene.layers) {
      this.images.set(layer.id, layer.frames.map((f) => f.toCanvas()))
      this.scroll.set(layer.id, 0)
    }
    for (const landmark of scene.landmarks) this.landmarkImages.set(landmark.id, landmark.pixmap.toCanvas())
  }

  resize(width: number, height: number) {
    this.width = width
    this.height = height
    for (const canvas of [this.back, this.front]) {
      canvas.width = width
      canvas.height = height
    }
    this.sky = this.scene.sky(height).toCanvas()
  }

  /**
   * Hace entrar el elemento `id` por la derecha. Con `settled` aparece ya junto al Pokémon (p. ej. al abrir la ruta
   * cuando ya está parado en esa parada).
   */
  spawnLandmark(id: string, settled = false) {
    const landmark = this.scene.landmarks.find((l) => l.id === id)
    if (!landmark) return
    const image = this.landmarkImages.get(id)!
    this.active.push({ landmark, image, x: settled ? Math.round(this.width * SETTLED_AT - image.width / 2) : this.width + 2 })
  }

  update(dt: number) {
    this.time += dt
    const pathSpeed = this.moving ? PATH_SPEED * this.speed : 0
    const moved = new Map<string, number>()
    for (const layer of this.scene.layers) {
      moved.set(layer.id, (pathSpeed * layer.parallax + (layer.drift ?? 0)) * dt)
      this.scroll.set(layer.id, this.scroll.get(layer.id)! + moved.get(layer.id)!)
    }
    this.smoke.update(dt, this.emitterLayers(), (id) => moved.get(id) ?? 0, this.width)
    for (const a of this.active) a.x -= pathSpeed * a.landmark.parallax * dt
    this.active = this.active.filter((a) => a.x > -a.image.width)
    this.scene.particles?.update(dt, pathSpeed, this.width, this.height)
  }

  draw() {
    const back = this.back.getContext('2d')!
    const front = this.front.getContext('2d')!
    back.clearRect(0, 0, this.width, this.height)
    front.clearRect(0, 0, this.width, this.height)
    if (this.sky) this.tile(back, this.sky, 0, 0)
    for (const layer of this.scene.layers) {
      const ctx = layer.plane === 'back' ? back : front
      if (!this.hidden.has(layer.id)) this.drawLayer(ctx, layer)
      if (!this.hidden.has(PARTICLES_ID)) this.smoke.draw(ctx, layer.id, this.layerTop(layer))
      this.drawLandmarks(ctx, layer.id)
    }
    if (!this.hidden.has(PARTICLES_ID)) this.scene.particles?.draw(front)
  }

  /** Fila de arriba de la capa en pantalla */
  private layerTop(layer: SceneLayer): number {
    const height = layer.frames[0].h
    return layer.anchor === 'top' ? layer.offset : this.height - layer.offset - height
  }

  private emitterLayers() {
    return this.scene.layers
      .filter((l) => l.emitters?.length)
      .map((l) => ({ id: l.id, emitters: l.emitters!, tileWidth: l.frames[0].w, scroll: this.scroll.get(l.id)! }))
  }

  private drawLayer(ctx: CanvasRenderingContext2D, layer: SceneLayer) {
    const frames = this.images.get(layer.id)!
    const tick = Math.floor(this.time * (layer.fps ?? 0))
    const frame = frames[((tick % frames.length) + frames.length) % frames.length]
    this.tile(ctx, frame, this.scroll.get(layer.id)!, this.layerTop(layer))
  }

  /** Repite la imagen en horizontal desplazada `scroll` píxeles hacia la izquierda */
  private tile(ctx: CanvasRenderingContext2D, image: HTMLCanvasElement, scroll: number, y: number) {
    const start = -(((Math.round(scroll) % image.width) + image.width) % image.width)
    for (let x = start; x < this.width; x += image.width) ctx.drawImage(image, x, Math.round(y))
  }

  /** Pinta las paradas en pantalla que van justo después de la capa `layerId` */
  private drawLandmarks(ctx: CanvasRenderingContext2D, layerId: string) {
    for (const { landmark, image, x } of this.active)
      if (landmark.afterLayer === layerId) ctx.drawImage(image, Math.round(x), this.height - landmark.bottom - image.height)
  }
}
