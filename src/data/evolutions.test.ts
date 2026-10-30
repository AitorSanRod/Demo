import { describe, expect, it } from 'vitest'
import { EVOLVING_SPECIES, evolutionsOf } from './evolutions'
import { species } from './species'

describe('evoluciones', () => {
  it('solo enlazan especies que existen, y nunca consigo misma', () => {
    for (const id of EVOLVING_SPECIES) {
      expect(() => species(id)).not.toThrow()
      for (const into of evolutionsOf(id)) {
        expect(() => species(into)).not.toThrow()
        expect(into).not.toBe(id)
      }
    }
  })

  it('no hay ciclos: siguiendo las evoluciones siempre se llega a una forma final', () => {
    for (const id of EVOLVING_SPECIES) {
      const seen = new Set<number>()
      const walk = (n: number) => {
        expect(seen.has(n)).toBe(false)
        seen.add(n)
        for (const into of evolutionsOf(n)) walk(into)
      }
      walk(id)
    }
  })

  it('cadenas conocidas', () => {
    expect(evolutionsOf(4)).toEqual([5])
    expect(evolutionsOf(6)).toEqual([])
    expect(evolutionsOf(133)).toEqual([134, 135, 136])
  })
})
