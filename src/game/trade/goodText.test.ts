import { describe, expect, it } from 'vitest'
import { species, STARTERS } from '../../data/species'
import { askText, goodText } from './goodText'
import { GoodKind } from './tradeGoods'

const [A, B, C] = STARTERS

describe('textos de lo que cambia de manos', () => {
  it('un Pokémon con su nivel y sus ★', () => {
    const text = goodText({ kind: GoodKind.Mon, mon: { speciesId: A, level: 12, exp: 0, stars: 2 } })
    expect(text).toContain(species(A).name)
    expect(text).toContain('12')
    expect(text).toContain('★★')
  })

  it('cantidades en singular y plural', () => {
    expect(goodText({ kind: GoodKind.Tickets, count: 1 })).not.toBe(goodText({ kind: GoodKind.Tickets, count: 2 }).replace('2', '1'))
    expect(goodText({ kind: GoodKind.Pieces, speciesId: B, count: 3 })).toContain(species(B).name)
  })

  it('lo pedido: una especie, o varias unidas con «o»', () => {
    expect(askText({ kind: GoodKind.Mon, speciesIds: [A] })).toBe(species(A).name)
    expect(askText({ kind: GoodKind.Mon, speciesIds: [A, B, C] })).toBe(`${species(A).name}, ${species(B).name} o ${species(C).name}`)
  })
})
