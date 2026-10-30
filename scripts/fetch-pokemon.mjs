// Descarga los 151 Pokémon de 1ª gen desde PokeAPI y genera src/data/pokemon.json
// Uso: node scripts/fetch-pokemon.mjs
import { writeFile } from 'node:fs/promises'

const API = 'https://pokeapi.co/api/v2'
const TOTAL = 151
const CONCURRENCY = 8

async function getJson(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url)
    if (res.ok) return res.json()
    await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
  }
  throw new Error(`Fallo al descargar ${url}`)
}

async function fetchOne(id) {
  const [mon, species] = await Promise.all([
    getJson(`${API}/pokemon/${id}`),
    getJson(`${API}/pokemon-species/${id}`),
  ])
  const stat = (name) => mon.stats.find((s) => s.stat.name === name).base_stat
  const es = species.names.find((n) => n.language.name === 'es')
  return {
    id,
    name: es ? es.name : mon.name,
    types: mon.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
    base: {
      hp: stat('hp'),
      atk: stat('attack'),
      def: stat('defense'),
      spa: stat('special-attack'),
      spd: stat('special-defense'),
      spe: stat('speed'),
    },
  }
}

const ids = Array.from({ length: TOTAL }, (_, i) => i + 1)
const result = []
for (let i = 0; i < ids.length; i += CONCURRENCY) {
  const chunk = await Promise.all(ids.slice(i, i + CONCURRENCY).map(fetchOne))
  result.push(...chunk)
  process.stdout.write(`\r${result.length}/${TOTAL}`)
}
await writeFile(new URL('../src/data/pokemon.json', import.meta.url), JSON.stringify(result))
console.log('\nOK -> src/data/pokemon.json')
