import { describe, expect, it } from 'vitest'
import { MOVES, signatureMove } from './moves'
import { RARITY_INFO, rarityOf, SPECIES, type Rarity } from './species'
import { TYPE_INFO } from './types'


describe('signatureMove', () => {
  it('es del primer tipo de la especie', () => {
    for (const sp of SPECIES) expect(signatureMove(sp.id).type).toBe(sp.types[0])
  })

  it('cuanto más rara es la especie, más potente es su ataque', () => {
    const order = Object.keys(RARITY_INFO) as Rarity[]
    const byType = new Map<string, Map<Rarity, number>>()
    for (const sp of SPECIES) {
      const mv = signatureMove(sp.id)
      if (!byType.has(mv.type)) byType.set(mv.type, new Map())
      byType.get(mv.type)!.set(rarityOf(sp), mv.power)
    }
    for (const powers of byType.values()) {
      const seen = order.filter((r) => powers.has(r)).map((r) => powers.get(r)!)
      expect(seen).toEqual([...seen].sort((a, b) => a - b))
    }
  })

  it('hay un movimiento distinto por cada tipo y rareza (sin ids repetidos)', () => {
    const types = Object.keys(TYPE_INFO).length
    const rarities = Object.keys(RARITY_INFO).length
    expect(Object.keys(MOVES)).toHaveLength(types * rarities)
  })
})
