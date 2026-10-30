import { describe, expect, it } from 'vitest'
import { POKEMON } from './pokemon'
import { SPECIES } from './species'

describe('POKEMON', () => {
  it('tiene una clave por especie y cada una apunta a la especie de su nombre', () => {
    const keyOf = (name: string) => name.replace('♀', 'F').replace('♂', 'M').replace(/[^A-Za-z0-9]/g, '')
    expect(Object.keys(POKEMON)).toHaveLength(SPECIES.length)
    for (const s of SPECIES) expect(POKEMON[keyOf(s.name) as keyof typeof POKEMON]).toBe(s.id)
  })
})
