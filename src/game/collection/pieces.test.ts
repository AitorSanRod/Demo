import { describe, expect, it } from 'vitest'
import { POKEMON } from '../../data/pokemon'
import { Rarity, RARITY_INFO, rarityOf, species } from '../../data/species'
import { initialState } from '../core/state'
import { chooseStarter, speciesOfRarity } from '../core/test-utils'
import { createMon, NEW_MON_LEVEL } from '../team/mons'
import { RANCH_SLOTS, slotsOf, usedSlots } from '../team/ranches'
import { MAX_STARS } from '../team/stats'
import { pickStarter } from '../team/tutorial'
import { markSeen } from './dex'
import {
  addPieces,
  canCombine,
  combinableCount,
  combine,
  combineBlocker,
  CombineKind,
  combinePrice,
  PIECES_PER_COMBINE,
  piecesOf,
  STAR_PRICE,
} from './pieces'

const createPrice = (speciesId: number) => RARITY_INFO[rarityOf(species(speciesId))].createPrice

/** Partida con inicial y dinero de sobra, para que solo cuente lo que se prueba */
function stateWithStarter() {
  const s = initialState()
  chooseStarter(s, POKEMON.Bulbasaur)
  s.money = 1e9
  return s
}

/** Especie vista con las piezas justas para combinarla */
function readyToCombine(s: ReturnType<typeof initialState>, speciesId: number) {
  markSeen(s, speciesId)
  addPieces(s, speciesId, PIECES_PER_COMBINE)
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

  it('con las piezas necesarias crea el Pokémon al nivel de los nuevos y lo marca como capturado', () => {
    const s = stateWithStarter()
    s.owned[0].level = NEW_MON_LEVEL + 20
    readyToCombine(s, POKEMON.Pidgey)
    addPieces(s, POKEMON.Pidgey, 2)
    expect(combine(s, POKEMON.Pidgey)).toMatchObject({ kind: CombineKind.Unlock, speciesId: POKEMON.Pidgey, level: NEW_MON_LEVEL })
    expect(s.owned.find((m) => m.speciesId === POKEMON.Pidgey)?.level).toBe(NEW_MON_LEVEL)
    expect(s.caught).toContain(POKEMON.Pidgey)
    expect(piecesOf(s, POKEMON.Pidgey)).toBe(2)
  })

  it('crear cuesta según la rareza y no se puede sin dinero', () => {
    for (const rarity of Object.values(Rarity)) {
      // Sin equipo, para que la especie sea siempre nueva
      const s = initialState()
      s.tutorial = null
      const id = speciesOfRarity(rarity)
      readyToCombine(s, id)
      s.money = createPrice(id) - 1
      expect(combineBlocker(s, id)).toMatch(/₽/)
      s.money = createPrice(id)
      expect(combine(s, id)?.kind).toBe(CombineKind.Unlock)
      expect(s.money).toBe(0)
    }
  })

  it('el inicial del tutorial se crea gratis', () => {
    const s = initialState()
    pickStarter(s, POKEMON.Bulbasaur)
    expect(combinePrice(s, POKEMON.Bulbasaur)).toBe(0)
    expect(combine(s, POKEMON.Bulbasaur)?.kind).toBe(CombineKind.Unlock)
    expect(s.money).toBe(initialState().money)
  })

  it('va al primer rancho con hueco y no se crea si no cabe en ninguno', () => {
    const s = stateWithStarter()
    const filler = speciesOfRarity(Rarity.Common)
    while (usedSlots(s, 0) + slotsOf(filler) <= RANCH_SLOTS) s.owned.push(createMon(filler, NEW_MON_LEVEL))
    readyToCombine(s, POKEMON.Pidgey)
    expect(combineBlocker(s, POKEMON.Pidgey)).toMatch(/rancho/)
    expect(combine(s, POKEMON.Pidgey)).toBeNull()
    s.upgrades.ranches = 1
    combine(s, POKEMON.Pidgey)
    expect(s.owned.find((m) => m.speciesId === POKEMON.Pidgey)?.ranch).toBe(1)
  })

  it('si ya lo tienes, le da una estrella por su precio', () => {
    const s = stateWithStarter()
    addPieces(s, POKEMON.Bulbasaur, PIECES_PER_COMBINE)
    s.money = STAR_PRICE - 1
    expect(canCombine(s, POKEMON.Bulbasaur)).toBe(false)
    s.money = STAR_PRICE
    expect(combine(s, POKEMON.Bulbasaur)).toMatchObject({ kind: CombineKind.Star, stars: 1 })
    expect(s.owned).toHaveLength(1)
    expect(s.money).toBe(0)
  })

  it('con las estrellas al máximo, las piezas se cambian por pokécuartos sin coste', () => {
    const s = stateWithStarter()
    s.owned[0].stars = MAX_STARS
    s.money = 0
    addPieces(s, POKEMON.Bulbasaur, PIECES_PER_COMBINE)
    const expected = RARITY_INFO[rarityOf(species(POKEMON.Bulbasaur))].surplusMoney
    expect(combine(s, POKEMON.Bulbasaur)).toMatchObject({ kind: CombineKind.Money, money: expected })
    expect(s.money).toBe(expected)
    expect(s.owned[0].stars).toBe(MAX_STARS)
  })
})

describe('combinableCount', () => {
  it('cuenta las especies vistas que se pueden combinar ya', () => {
    const s = stateWithStarter()
    readyToCombine(s, POKEMON.Pidgey)
    addPieces(s, POKEMON.Rattata, PIECES_PER_COMBINE)
    expect(combinableCount(s)).toBe(1)
  })
})
