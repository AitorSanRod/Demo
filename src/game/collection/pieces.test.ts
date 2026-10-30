import { describe, expect, it } from 'vitest'
import { Pokemon } from '../../data/pokemon'
import { RARITY_INFO, rarityOf, species } from '../../data/species'
import { initialState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { MAX_STARS } from '../team/stats'
import { addPieces, canCombine, combinableCount, combine, CombineKind, PIECES_PER_COMBINE, piecesOf } from './pieces'


function stateWithStarter() {
  const s = initialState()
  chooseStarter(s, Pokemon.Bulbasaur)
  return s
}

describe('combine', () => {
  it('no combina con menos de 5 piezas', () => {
    const s = stateWithStarter()
    addPieces(s, Pokemon.Pidgey, PIECES_PER_COMBINE - 1)
    expect(canCombine(s, Pokemon.Pidgey)).toBe(false)
    expect(combine(s, Pokemon.Pidgey)).toBeNull()
    expect(piecesOf(s, Pokemon.Pidgey)).toBe(PIECES_PER_COMBINE - 1)
  })

  it('con 5 piezas desbloquea el Pokémon y lo marca como capturado', () => {
    const s = stateWithStarter()
    addPieces(s, Pokemon.Pidgey, PIECES_PER_COMBINE + 2)
    expect(combine(s, Pokemon.Pidgey)).toMatchObject({ kind: CombineKind.Unlock, speciesId: Pokemon.Pidgey, level: 5 })
    expect(s.owned.map((m) => m.speciesId)).toContain(Pokemon.Pidgey)
    expect(s.caught).toContain(Pokemon.Pidgey)
    expect(piecesOf(s, Pokemon.Pidgey)).toBe(2)
  })

  it('si ya lo tienes, le da una estrella', () => {
    const s = stateWithStarter()
    addPieces(s, Pokemon.Bulbasaur, PIECES_PER_COMBINE)
    expect(combine(s, Pokemon.Bulbasaur)).toMatchObject({ kind: CombineKind.Star, stars: 1 })
    expect(s.owned).toHaveLength(1)
  })

  it('con las estrellas al máximo, las piezas se cambian por pokécuartos', () => {
    const s = stateWithStarter()
    s.owned[0].stars = MAX_STARS
    const money = s.money
    addPieces(s, Pokemon.Bulbasaur, PIECES_PER_COMBINE)
    const expected = RARITY_INFO[rarityOf(species(Pokemon.Bulbasaur))].surplusMoney
    expect(combine(s, Pokemon.Bulbasaur)).toMatchObject({ kind: CombineKind.Money, money: expected })
    expect(s.money).toBe(money + expected)
    expect(s.owned[0].stars).toBe(MAX_STARS)
  })
})

describe('combinableCount', () => {
  it('cuenta las especies con piezas suficientes', () => {
    const s = initialState()
    addPieces(s, Pokemon.Pidgey, PIECES_PER_COMBINE)
    addPieces(s, Pokemon.Rattata, 1)
    expect(combinableCount(s)).toBe(1)
  })
})
