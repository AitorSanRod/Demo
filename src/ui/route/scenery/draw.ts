// Fondos pixel-art por capas (parallax) para la escena de caminar, al estilo de las intros de GBA.
// Cada capa es una tesela SVG que se repite en horizontal; se dibuja en "píxeles GBA" y se escala x SCALE.

export const SCALE = 4

export interface SceneLayer {
  image: string
  w: number
  h: number
  /** Velocidad de desplazamiento en px de pantalla por segundo */
  speed: number
  anchor: 'top' | 'bottom'
  /** Distancia al borde de anclaje, en píxeles GBA */
  offset: number
}

export interface Scene {
  sky: string
  back: SceneLayer[]
  front: SceneLayer[]
  /** Altura de los pies del Pokémon sobre el borde inferior, en píxeles GBA */
  walkerBottom: number
  /** En el agua el Pokémon flota en lugar de dar saltitos */
  surf?: boolean
}

export const rect = (x: number, y: number, w: number, h: number, c: string) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`

/** Elipse rellena fila a fila, para que los bordes queden escalonados como en un sprite */
export function blob(cx: number, cy: number, rx: number, ry: number, c: string): string {
  let out = ''
  for (let dy = -ry; dy <= ry; dy++) {
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy / (ry + 0.5)) ** 2)))
    if (half > 0) out += rect(cx - half, cy + dy, half * 2, 1, c)
  }
  return out
}

/** Estalactita/estalagmita escalonada */
export function spike(x: number, y: number, len: number, width: number, c: string, down: boolean): string {
  let out = ''
  for (let i = 0; i < len; i++) {
    const w = Math.max(1, Math.round(((len - i) / len) * width))
    out += rect(x - Math.floor(w / 2), down ? y + i : y - i, w, 1, c)
  }
  return out
}

/** Dibuja la tesela también desplazada ±w para que las figuras que cruzan el borde encajen al repetir */
export const tiled = (w: number, draw: (dx: number) => string) => draw(-w) + draw(0) + draw(w)

export function tile(w: number, h: number, body: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${body}</svg>`
  return { image: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, w, h }
}

export const layer = (t: ReturnType<typeof tile>, speed: number, anchor: 'top' | 'bottom', offset: number): SceneLayer => ({
  ...t,
  speed,
  anchor,
  offset,
})
