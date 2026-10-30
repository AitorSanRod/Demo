import { describe, expect, it } from 'vitest'
import { EVOLVING_SPECIES, evolutionsOf } from '../../data/evolutions'
import { RouteId } from '../../data/maps'
import { SPECIES } from '../../data/species'
import { initialState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { EVOLUTION_STARS, EVOLVED_LEVEL, EvolveKind, evolve, evolveBlocker } from './evolution'
import { createMon } from './mons'
import { MAX_STARS } from './stats'

const FROM = EVOLVING_SPECIES[0]
const INTO = evolutionsOf(FROM)[0]
const NOT_INTO = SPECIES.find((sp) => sp.id !== FROM && !evolutionsOf(FROM).includes(sp.id))!.id
const BRANCHING = EVOLVING_SPECIES.find((id) => evolutionsOf(id).length > 1)

/** Partida con un Pokémon activo que ya tiene las ★ para evolucionar */
function stateReady() {
  const s = initialState()
  chooseStarter(s, FROM)
  const mon = s.owned[0]
  mon.level = EVOLVED_LEVEL + 15
  mon.stars = EVOLUTION_STARS
  return { s, mon }
}

describe('evolve', () => {
  it('sin la evolución en el equipo: desaparece y llega la evolución al nivel previsto y sin ★', () => {
    const { s, mon } = stateReady()
    expect(evolve(s, mon.uid, INTO)).toMatchObject({ kind: EvolveKind.New, fromId: FROM, intoId: INTO, stars: 0 })
    expect(s.owned.map((m) => [m.speciesId, m.level, m.stars])).toEqual([[INTO, EVOLVED_LEVEL, 0]])
    expect(s.caught).toContain(INTO)
  })

  it('si era el activo, la evolución pasa a ser el activo', () => {
    const { s, mon } = stateReady()
    evolve(s, mon.uid, INTO)
    expect(s.owned.find((m) => m.uid === s.activeUid)?.speciesId).toBe(INTO)
  })

  it('con la evolución ya en el equipo: desaparece y la que tenías gana una ★, sin cambiar su nivel', () => {
    const { s, mon } = stateReady()
    const owned = createMon(INTO, 30)
    s.owned.push(owned)
    expect(evolve(s, mon.uid, INTO)).toMatchObject({ kind: EvolveKind.Star, stars: 1 })
    expect(s.owned).toHaveLength(1)
    expect(s.owned[0]).toMatchObject({ uid: owned.uid, level: 30, stars: 1 })
  })

  it('necesita las ★ exigidas', () => {
    const { s, mon } = stateReady()
    mon.stars = EVOLUTION_STARS - 1
    expect(evolveBlocker(s, mon.uid, INTO)).toMatch(/★/)
    expect(evolve(s, mon.uid, INTO)).toBeNull()
    expect(s.owned[0].speciesId).toBe(FROM)
  })

  it('no evoluciona a una especie que no le corresponde ni fuera del rancho', () => {
    const { s, mon } = stateReady()
    expect(evolveBlocker(s, mon.uid, NOT_INTO)).not.toBeNull()
    s.expeditions.push({ uid: mon.uid, routeId: RouteId.PuebloPaleta, durationMin: 15, elapsedMin: 0 })
    expect(evolveBlocker(s, mon.uid, INTO)).toMatch(/rancho/)
  })

  it('no evoluciona si la que ya tienes no puede ganar más ★', () => {
    const { s, mon } = stateReady()
    const owned = createMon(INTO, 30)
    owned.stars = MAX_STARS
    s.owned.push(owned)
    expect(evolveBlocker(s, mon.uid, INTO)).toMatch(/máximo/)
  })

  it.runIf(BRANCHING)('con varias opciones se elige a cuál evoluciona', () => {
    const s = initialState()
    const mon = createMon(BRANCHING!, 10)
    mon.stars = EVOLUTION_STARS
    s.owned.push(mon)
    const last = evolutionsOf(BRANCHING!).at(-1)!
    expect(evolve(s, mon.uid, last)?.intoId).toBe(last)
    expect(s.owned[0].speciesId).toBe(last)
  })
})
