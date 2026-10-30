import { describe, expect, it } from 'vitest'
import { RARITY_INFO, rarityOf, species } from '../../data/species'
import { initialState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { MAX_STARS } from '../team/stats'
import { addPieces, canCombine, combinableCount, combine, PIECES_PER_COMBINE, piecesOf } from './pieces'

const PIDGEY = 16

function stateWithStarter() {
  const s = initialState()
  chooseStarter(s, 1)
  return s
}

describe('combine', () => {
  it('no combina con menos de 5 piezas', () => {
    const s = stateWithStarter()
    addPieces(s, PIDGEY, PIECES_PER_COMBINE - 1)
    expect(canCombine(s, PIDGEY)).toBe(false)
    expect(combine(s, PIDGEY)).toBeNull()
    expect(piecesOf(s, PIDGEY)).toBe(PIECES_PER_COMBINE - 1)
  })

  it('con 5 piezas desbloquea el Pokémon y lo marca como capturado', () => {
    const s = stateWithStarter()
    addPieces(s, PIDGEY, PIECES_PER_COMBINE + 2)
    expect(combine(s, PIDGEY)).toMatchObject({ kind: 'unlock', speciesId: PIDGEY, level: 5 })
    expect(s.owned.map((m) => m.speciesId)).toContain(PIDGEY)
    expect(s.caught).toContain(PIDGEY)
    expect(piecesOf(s, PIDGEY)).toBe(2)
  })

  it('si ya lo tienes, le da una estrella', () => {
    const s = stateWithStarter()
    addPieces(s, 1, PIECES_PER_COMBINE)
    expect(combine(s, 1)).toMatchObject({ kind: 'star', stars: 1 })
    expect(s.owned).toHaveLength(1)
  })

  it('con las estrellas al máximo, las piezas se cambian por pokécuartos', () => {
    const s = stateWithStarter()
    s.owned[0].stars = MAX_STARS
    const money = s.money
    addPieces(s, 1, PIECES_PER_COMBINE)
    const expected = RARITY_INFO[rarityOf(species(1))].surplusMoney
    expect(combine(s, 1)).toMatchObject({ kind: 'money', money: expected })
    expect(s.money).toBe(money + expected)
    expect(s.owned[0].stars).toBe(MAX_STARS)
  })
})

describe('combinableCount', () => {
  it('cuenta las especies con piezas suficientes', () => {
    const s = initialState()
    addPieces(s, PIDGEY, PIECES_PER_COMBINE)
    addPieces(s, 19, 1)
    expect(combinableCount(s)).toBe(1)
  })
})
