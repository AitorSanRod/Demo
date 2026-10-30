import { describe, expect, it } from 'vitest'
import { Pokemon } from './pokemon'
import { SPECIES } from './species'

describe('Pokemon', () => {
  it('tiene una clave por especie y cada una apunta a la especie de su nombre', () => {
    const keyOf = (name: string) => name.replace('♀', 'F').replace('♂', 'M').replace(/[^A-Za-z0-9]/g, '')
    expect(Object.keys(Pokemon)).toHaveLength(SPECIES.length)
    for (const s of SPECIES) expect(Pokemon[keyOf(s.name) as keyof typeof Pokemon]).toBe(s.id)
  })
})
