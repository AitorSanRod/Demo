import { describe, expect, it } from 'vitest'
import { RouteId } from '../../data/maps'
import { PASSIVE_THRESHOLDS } from '../../data/passives'
import { RANCH_TYPE_IDS, RANCH_TYPE_THRESHOLD_DISCOUNT, RANCH_TYPES } from '../../data/ranchTypes'
import { SPECIES } from '../../data/species'
import type { PokeType } from '../../data/types'
import { initialState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { createMon, NEW_MON_LEVEL } from './mons'
import { passiveThreshold, ranchPassives, ranchTypeCounts } from './ranchPassives'
import { buyRanchType, placeRanchType } from './ranchTypes'

/** Especie de un solo tipo, para que cada Pokémon sume exactamente 1 a ese tipo */
const pureOf = (type: PokeType) => SPECIES.find((sp) => sp.types.length === 1 && sp.types[0] === type)!.id
const DUAL = SPECIES.find((sp) => sp.types.length === 2)!
const [LEVEL_1, LEVEL_2] = PASSIVE_THRESHOLDS

/** Rancho 0 con `count` Pokémon de un solo tipo (el primero es el activo) */
function ranchWith(type: PokeType, count: number) {
  const s = initialState()
  chooseStarter(s, pureOf(type))
  for (let i = 1; i < count; i++) s.owned.push(createMon(pureOf(type), NEW_MON_LEVEL))
  s.money = 1e9
  return s
}

describe('ranchTypeCounts', () => {
  it('los de dos tipos suman a ambos', () => {
    const s = initialState()
    chooseStarter(s, DUAL.id)
    expect(ranchTypeCounts(s, 0)).toEqual({ [DUAL.types[0]]: 1, [DUAL.types[1]]: 1 })
  })

  it('cuentan todos los del rancho, también el activo y los que están de expedición, y no los de otros ranchos', () => {
    const s = ranchWith('normal', 3)
    s.expeditions.push({ uid: s.owned[1].uid, routeId: RouteId.PuebloPaleta, durationMin: 15, elapsedMin: 0 })
    s.owned.push(createMon(pureOf('normal'), NEW_MON_LEVEL, 1))
    expect(ranchTypeCounts(s, 0).normal).toBe(3)
  })
})

describe('ranchPassives', () => {
  it(`con ${LEVEL_1} del mismo tipo da el nivel 1 y con ${LEVEL_2}, el nivel 2`, () => {
    expect(ranchPassives(ranchWith('fire', LEVEL_1 - 1), 0)).toEqual([])
    expect(ranchPassives(ranchWith('fire', LEVEL_1), 0)).toEqual([{ type: 'fire', level: 1 }])
    expect(ranchPassives(ranchWith('fire', LEVEL_2), 0)).toEqual([{ type: 'fire', level: 2 }])
  })

  it('un tipo de rancho que favorece al tipo rebaja los umbrales', () => {
    const id = RANCH_TYPE_IDS.find((r) => RANCH_TYPES[r].favors.includes('water'))!
    const s = ranchWith('water', LEVEL_1 - RANCH_TYPE_THRESHOLD_DISCOUNT)
    expect(ranchPassives(s, 0)).toEqual([])
    buyRanchType(s, id)
    placeRanchType(s, 0, id)
    expect(passiveThreshold(s, 0, 'water', 2)).toBe(LEVEL_2 - RANCH_TYPE_THRESHOLD_DISCOUNT)
    expect(ranchPassives(s, 0)).toEqual([{ type: 'water', level: 1 }])
  })

  it('el tipo de rancho no rebaja los tipos que no favorece', () => {
    const id = RANCH_TYPE_IDS.find((r) => !RANCH_TYPES[r].favors.includes('fire'))!
    const s = ranchWith('fire', 1)
    buyRanchType(s, id)
    placeRanchType(s, 0, id)
    expect(passiveThreshold(s, 0, 'fire', 1)).toBe(LEVEL_1)
  })
})
