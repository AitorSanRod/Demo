// Museo de fachada clásica: frontón triangular con una placa, fila de columnas delante de un pórtico en sombra,
// puerta grande en el centro y escalinata. Luz arriba a la izquierda; contorno solo abajo y a la derecha.

import { Pixmap, type Color } from '../paint/pixmap'

export interface MuseumPalette {
  /** Piedra: sombra, base, luz y brillo */
  stone: readonly Color[]
  ink: Color
  /** Tejado del frontón: sombra, base y luz */
  roof: readonly Color[]
  /** Pórtico (el fondo en sombra entre columnas) y puerta: oscuro y base */
  shadow: readonly Color[]
}

/** Medidas a escala 1, en píxeles de arte: frontón, cornisa, alto de las columnas, escalinata */
const BASE = { width: 120, pediment: 18, cornice: 4, columns: 34, steps: 6, column: 6, door: [16, 22] }
/** Columnas de la fachada */
const COLUMNS = 6

const scaled = (scale: number) => {
  const s = (n: number) => Math.max(2, Math.round(n * scale))
  return { width: s(BASE.width), pediment: s(BASE.pediment), cornice: s(BASE.cornice), columns: s(BASE.columns), steps: s(BASE.steps), column: s(BASE.column), door: BASE.door.map(s) }
}

function pediment(pix: Pixmap, p: MuseumPalette, w: number, h: number) {
  for (let y = 0; y < h; y++) {
    const half = Math.round(((y + 1) / h) * (w / 2))
    const left = Math.round(w / 2 - half)
    const right = Math.round(w / 2 + half) - 1
    pix.rect(left, y, right - left + 1, 1, y < 2 ? p.roof[2] : p.stone[1])
    pix.set(left, y, p.roof[1])
    pix.set(left + 1, y, p.roof[2])
    pix.set(right, y, p.roof[0])
    pix.set(right - 1, y, p.roof[1])
  }
  const plate = Math.round(w * 0.22)
  pix.rect(Math.round(w / 2 - plate / 2), Math.round(h * 0.5), plate, Math.max(2, Math.round(h * 0.3)), p.stone[3])
  pix.rect(Math.round(w / 2 + plate / 2), Math.round(h * 0.5), 1, Math.max(2, Math.round(h * 0.3)), p.stone[0])
}

function column(pix: Pixmap, p: MuseumPalette, x: number, top: number, w: number, h: number) {
  pix.rect(x - 1, top, w + 2, 2, p.stone[2])
  pix.rect(x, top + 2, w, h - 4, p.stone[2])
  pix.rect(x, top + 2, 1, h - 4, p.stone[3])
  pix.rect(x + w - 2, top + 2, 2, h - 4, p.stone[0])
  pix.rect(x + Math.floor(w / 2), top + 3, 1, h - 6, p.stone[1])
  pix.rect(x - 1, top + h - 2, w + 2, 2, p.stone[1])
  pix.set(x + w + 1, top + h - 1, p.ink)
}

/** Museo a `scale` (1 = 120 píxeles de ancho) */
export function museum(p: MuseumPalette, scale = 1): Pixmap {
  const m = scaled(scale)
  const height = m.pediment + m.cornice + m.columns + m.steps
  const pix = new Pixmap(m.width, height, false)
  pediment(pix, p, m.width, m.pediment)
  const corniceY = m.pediment
  pix.rect(0, corniceY, m.width, m.cornice, p.stone[2])
  pix.rect(0, corniceY, m.width, 1, p.stone[3])
  pix.rect(0, corniceY + m.cornice - 1, m.width, 1, p.stone[0])
  pix.rect(m.width - 1, corniceY, 1, m.cornice, p.ink)
  const inset = Math.round(m.width * 0.06)
  const colTop = corniceY + m.cornice
  pix.rect(inset, colTop, m.width - inset * 2, m.columns, p.shadow[1])
  pix.rect(inset, colTop, m.width - inset * 2, 2, p.shadow[0])
  const [dw, dh] = m.door
  pix.rect(Math.round(m.width / 2 - dw / 2), colTop + m.columns - dh, dw, dh, p.shadow[0])
  pix.rect(Math.round(m.width / 2), colTop + m.columns - dh, 1, dh, p.shadow[1])
  const span = m.width - inset * 2 - m.column
  for (let i = 0; i < COLUMNS; i++) column(pix, p, Math.round(inset + (span * i) / (COLUMNS - 1)), colTop, m.column, m.columns)
  for (let k = 0; k < 3; k++) {
    const stepH = Math.ceil(m.steps / 3)
    const y = colTop + m.columns + k * stepH
    const out = Math.round(inset * (0.6 - k * 0.3))
    pix.rect(out, y, m.width - out * 2, stepH, p.stone[2])
    pix.rect(out, y, m.width - out * 2, 1, p.stone[3])
    pix.rect(m.width - out - 1, y, 1, stepH, p.ink)
  }
  pix.rect(0, height - 1, m.width, 1, p.ink)
  return pix
}
