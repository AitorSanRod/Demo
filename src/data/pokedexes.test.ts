import { describe, expect, it } from 'vitest'
import { dexSections, REGIONAL_DEXES } from './pokedexes'
import { SPECIES } from './species'

describe('dexSections', () => {
  const sections = dexSections()

  it('pone cada especie en una sola Pokédex', () => {
    const ids = sections.flatMap((s) => s.species.map((sp) => sp.id))
    expect([...ids].sort((a, b) => a - b)).toEqual(SPECIES.map((s) => s.id).sort((a, b) => a - b))
  })

  it('cada regional solo tiene especies de su rango y la Nacional va al final', () => {
    for (const { dex, species } of sections.slice(0, -1)) {
      for (const sp of species) expect(sp.id).toBeGreaterThanOrEqual(dex!.first)
      for (const sp of species) expect(sp.id).toBeLessThanOrEqual(dex!.last)
    }
    expect(sections.at(-1)!.dex).toBeNull()
  })

  it('la Nacional tiene las especies fuera de todos los rangos', () => {
    for (const sp of sections.at(-1)!.species) {
      expect(REGIONAL_DEXES.some((d) => sp.id >= d.first && sp.id <= d.last)).toBe(false)
    }
  })
})
