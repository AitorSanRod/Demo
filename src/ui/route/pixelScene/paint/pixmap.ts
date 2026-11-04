// Lienzo de píxeles en memoria. Con `wrapX` lo que se sale por un lado aparece por el otro,
// así cualquier capa dibujada encima se repite en horizontal sin costura.

/** Color RGBA empaquetado en el orden de ImageData (0xAABBGGRR en little-endian) */
export type Color = number

export const TRANSPARENT: Color = 0

export function hex(code: string): Color {
  const n = parseInt(code.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0
}

export const palette = (...codes: string[]): Color[] => codes.map(hex)

/** Color semitransparente (`alpha` de 0 a 1), para luces y brumas que dejan ver lo de detrás */
export function rgba(code: string, alpha: number): Color {
  const opaque = hex(code) & 0x00ffffff
  return ((Math.round(alpha * 255) << 24) | opaque) >>> 0
}

export class Pixmap {
  readonly w: number
  readonly h: number
  readonly wrapX: boolean
  readonly data: Uint32Array

  constructor(w: number, h: number, wrapX = true) {
    this.w = w
    this.h = h
    this.wrapX = wrapX
    this.data = new Uint32Array(w * h)
  }

  private index(x: number, y: number): number {
    const yi = Math.floor(y)
    let xi = Math.floor(x)
    if (yi < 0 || yi >= this.h) return -1
    if (this.wrapX) xi = ((xi % this.w) + this.w) % this.w
    else if (xi < 0 || xi >= this.w) return -1
    return yi * this.w + xi
  }

  set(x: number, y: number, c: Color): void {
    const i = this.index(x, y)
    if (i >= 0) this.data[i] = c
  }

  get(x: number, y: number): Color {
    const i = this.index(x, y)
    return i >= 0 ? this.data[i] : TRANSPARENT
  }

  rect(x: number, y: number, w: number, h: number, c: Color): void {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c)
  }

  /** Copia otro lienzo encima respetando su transparencia */
  stamp(src: Pixmap, x: number, y: number): void {
    for (let yy = 0; yy < src.h; yy++)
      for (let xx = 0; xx < src.w; xx++) {
        const c = src.data[yy * src.w + xx]
        if (c !== TRANSPARENT) this.set(x + xx, y + yy, c)
      }
  }

  toCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = this.w
    canvas.height = this.h
    const pixels = new Uint8ClampedArray(this.data.length * 4)
    pixels.set(new Uint8Array(this.data.buffer, this.data.byteOffset, this.data.byteLength))
    canvas.getContext('2d')!.putImageData(new ImageData(pixels, this.w, this.h), 0, 0)
    return canvas
  }
}
