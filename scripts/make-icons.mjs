// Genera los iconos PNG de la PWA (una pokéball dibujada píxel a píxel) sin dependencias.
// Uso: node scripts/make-icons.mjs
import { writeFile } from 'node:fs/promises'
import { deflateSync } from 'node:zlib'

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x / size, y / size)
      const o = y * (size * 4 + 1) + 1 + x * 4
      raw[o] = r
      raw[o + 1] = g
      raw[o + 2] = b
      raw[o + 3] = 255
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// scale < 1 deja margen para iconos "maskable"
const pokeball = (scale) => (u, v) => {
  const x = (u - 0.5) / scale
  const y = (v - 0.5) / scale
  const d = Math.hypot(x, y)
  const BG = [155, 32, 8]
  if (d > 0.42) return BG
  if (d > 0.39) return [20, 20, 20]
  if (d < 0.09) return d > 0.065 ? [20, 20, 20] : [250, 250, 250]
  if (Math.abs(y) < 0.03) return [20, 20, 20]
  return y < 0 ? [227, 53, 13] : [250, 250, 250]
}

const out = (name) => new URL(`../public/icons/${name}`, import.meta.url)
await writeFile(out('icon-192.png'), png(192, pokeball(1)))
await writeFile(out('icon-512.png'), png(512, pokeball(1)))
await writeFile(out('maskable-512.png'), png(512, pokeball(0.8)))
await writeFile(out('apple-touch-icon.png'), png(180, pokeball(0.9)))
console.log('OK -> public/icons')
