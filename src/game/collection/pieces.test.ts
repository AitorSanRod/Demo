import { describe, expect, it } from 'vitest'
import { POKEMON } from '../../data/pokemon'
import { RARITY_INFO, rarityOf, species } from '../../data/species'
import { initialState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { MAX_STARS } from '../team/stats'
import { markSeen } from './dex'
import { addPieces, canCombine, combinableCount, combine, CombineKind, PIECES_PER_COMBINE, piecesOf } from './pieces'


function stateWithStarter() {
  const s = initialState()
  chooseStarter(s, POKEMON.Bulbasaur)
  return s
}

describe('combine', () => {
  it('no combina con menos piezas de las necesarias', () => {
    const s = stateWithStarter()
    addPieces(s, POKEMON.Pidgey, PIECES_PER_COMBINE - 1)
    expect(canCombine(s, POKEMON.Pidgey)).toBe(false)
    expect(combine(s, POKEMON.Pidgey)).toBeNull()
    expect(piecesOf(s, POKEMON.Pidgey)).toBe(PIECES_PER_COMBINE - 1)
  })

  it('guarda las piezas de una especie no vista, sin marcarla ni dejar combinarla hasta verla', () => {
    const s = stateWithStarter()
    addPieces(s, POKEMON.Pidgey, PIECES_PER_COMBINE)
    expect(s.seen).not.toContain(POKEMON.Pidgey)
    expect(combine(s, POKEMON.Pidgey)).toBeNull()
    expect(piecesOf(s, POKEMON.Pidgey)).toBe(PIECES_PER_COMBINE)
    markSeen(s, POKEMON.Pidgey)
    expect(canCombine(s, POKEMON.Pidgey)).toBe(true)
  })

  it('con las piezas necesarias desbloquea el Pokémon y lo marca como capturado', () => {
    const s = stateWithStarter()
    markSeen(s, POKEMON.Pidgey)
    addPieces(s, POKEMON.Pidgey, PIECES_PER_COMBINE + 2)
    expect(combine(s, POKEMON.Pidgey)).toMatchObject({ kind: CombineKind.Unlock, speciesId: POKEMON.Pidgey })
    expect(s.owned.map((m) => m.speciesId)).toContain(POKEMON.Pidgey)
    expect(s.caught).toContain(POKEMON.Pidgey)
    expect(piecesOf(s, POKEMON.Pidgey)).toBe(2)
  })

  it('si ya lo tienes, le da una estrella', () => {
    const s = stateWithStarter()
    addPieces(s, POKEMON.Bulbasaur, PIECES_PER_COMBINE)
    expect(combine(s, POKEMON.Bulbasaur)).toMatchObject({ kind: CombineKind.Star, stars: 1 })
    expect(s.owned).toHaveLength(1)
  })

  it('con las estrellas al máximo, las piezas se cambian por pokécuartos', () => {
    const s = stateWithStarter()
    s.owned[0].stars = MAX_STARS
    const money = s.money
    addPieces(s, POKEMON.Bulbasaur, PIECES_PER_COMBINE)
    const expected = RARITY_INFO[rarityOf(species(POKEMON.Bulbasaur))].surplusMoney
    expect(combine(s, POKEMON.Bulbasaur)).toMatchObject({ kind: CombineKind.Money, money: expected })
    expect(s.money).toBe(money + expected)
    expect(s.owned[0].stars).toBe(MAX_STARS)
  })
})

describe('combinableCount', () => {
  it('cuenta las especies vistas con piezas suficientes', () => {
    const s = initialState()
    markSeen(s, POKEMON.Pidgey)
    addPieces(s, POKEMON.Pidgey, PIECES_PER_COMBINE)
    addPieces(s, POKEMON.Rattata, PIECES_PER_COMBINE)
    expect(combinableCount(s)).toBe(1)
  })
})
