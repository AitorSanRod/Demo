import { describe, expect, it } from 'vitest'
import { RouteId } from '../../data/maps'
import { Pokemon } from '../../data/pokemon'
import { initialState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { EVOLUTION_STARS, evolve, evolveBlocker, EVOLVED_LEVEL, EvolveKind } from './evolution'
import { createMon } from './mons'
import { MAX_STARS } from './stats'


/** Partida con Charmander activo, Nv. 20 y con las ★ para evolucionar */
function stateReady() {
  const s = initialState()
  chooseStarter(s, Pokemon.Charmander)
  const mon = s.owned[0]
  mon.level = 20
  mon.stars = EVOLUTION_STARS
  return { s, mon }
}

describe('evolve', () => {
  it('sin la evolución en el equipo: desaparece y llega la evolución a Nv. 5 y sin ★', () => {
    const { s, mon } = stateReady()
    expect(evolve(s, mon.uid, Pokemon.Charmeleon)).toMatchObject({ kind: EvolveKind.New, fromId: Pokemon.Charmander, intoId: Pokemon.Charmeleon, stars: 0 })
    expect(s.owned.map((m) => [m.speciesId, m.level, m.stars])).toEqual([[Pokemon.Charmeleon, EVOLVED_LEVEL, 0]])
    expect(s.caught).toContain(Pokemon.Charmeleon)
  })

  it('si era el activo, la evolución pasa a ser el activo', () => {
    const { s, mon } = stateReady()
    evolve(s, mon.uid, Pokemon.Charmeleon)
    expect(s.owned.find((m) => m.uid === s.activeUid)?.speciesId).toBe(Pokemon.Charmeleon)
  })

  it('con la evolución ya en el equipo: desaparece y la que tenías gana una ★, sin cambiar su nivel', () => {
    const { s, mon } = stateReady()
    const charmeleon = createMon(Pokemon.Charmeleon, 30)
    charmeleon.stars = 2
    s.owned.push(charmeleon)
    expect(evolve(s, mon.uid, Pokemon.Charmeleon)).toMatchObject({ kind: EvolveKind.Star, stars: 3 })
    expect(s.owned).toHaveLength(1)
    expect(s.owned[0]).toMatchObject({ uid: charmeleon.uid, level: 30, stars: 3 })
  })

  it('necesita las ★ al máximo', () => {
    const { s, mon } = stateReady()
    mon.stars = EVOLUTION_STARS - 1
    expect(evolveBlocker(s, mon.uid, Pokemon.Charmeleon)).toMatch(/★/)
    expect(evolve(s, mon.uid, Pokemon.Charmeleon)).toBeNull()
    expect(s.owned[0].speciesId).toBe(Pokemon.Charmander)
  })

  it('no evoluciona a una especie que no le corresponde ni fuera del rancho', () => {
    const { s, mon } = stateReady()
    expect(evolveBlocker(s, mon.uid, Pokemon.Charizard)).not.toBeNull()
    s.expeditions.push({ uid: mon.uid, routeId: RouteId.PuebloPaleta, durationMin: 15, elapsedMin: 0 })
    expect(evolveBlocker(s, mon.uid, Pokemon.Charmeleon)).toMatch(/rancho/)
  })

  it('no evoluciona si la que ya tienes no puede ganar más ★', () => {
    const { s, mon } = stateReady()
    const charmeleon = createMon(Pokemon.Charmeleon, 30)
    charmeleon.stars = MAX_STARS
    s.owned.push(charmeleon)
    expect(evolveBlocker(s, mon.uid, Pokemon.Charmeleon)).toMatch(/máximo/)
  })

  it('Eevee elige su evolución', () => {
    const s = initialState()
    const eevee = createMon(Pokemon.Eevee, 10)
    eevee.stars = EVOLUTION_STARS
    s.owned.push(eevee)
    expect(evolve(s, eevee.uid, Pokemon.Flareon)?.intoId).toBe(Pokemon.Flareon)
    expect(s.owned[0].speciesId).toBe(Pokemon.Flareon)
  })
})
