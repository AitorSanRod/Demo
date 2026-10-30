// Genera los iconos PNG de la PWA a partir de public/favicon.svg, para que siempre sean el mismo dibujo.
// Uso: node scripts/make-icons.mjs
import { readFile, writeFile } from 'node:fs/promises'
import { Resvg } from '@resvg/resvg-js'

/** Fondo opaco de los iconos: iOS y los iconos «maskable» de Android no admiten transparencia */
const BACKGROUND = '#9b2008'
/** Parte del icono que ocupa el dibujo; así cabe en la zona segura de los «maskable» (el 80% central) */
const ARTWORK_SCALE = 0.75

const favicon = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8')
const margin = (1 - ARTWORK_SCALE) / 2

function png(size) {
  const artwork = favicon.replace(
    '<svg ',
    `<svg x="${margin * size}" y="${margin * size}" width="${ARTWORK_SCALE * size}" height="${ARTWORK_SCALE * size}" `,
  )
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="100%" height="100%" fill="${BACKGROUND}"/>${artwork}</svg>`
  return new Resvg(svg).render().asPng()
}

const out = (name) => new URL(`../public/icons/${name}`, import.meta.url)
await writeFile(out('icon-192.png'), png(192))
await writeFile(out('icon-512.png'), png(512))
await writeFile(out('maskable-512.png'), png(512))
await writeFile(out('apple-touch-icon.png'), png(180))
console.log('OK -> public/icons')
