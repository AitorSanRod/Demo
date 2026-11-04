import { describe, expect, it } from 'vitest'
import { EVOLVING_SPECIES, evolutionsOf, type Evolution } from '../../data/evolutions'
import { RouteId } from '../../data/maps'
import { SPECIES } from '../../data/species'
import { initialState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { evolve, evolveBlocker, evolvePrice } from './evolution'
import { createMon, NEW_MON_LEVEL } from './mons'
import { RANCH_SLOTS, slotsOf, usedSlots } from './ranches'
import { maxHp } from './stats'
import { stonesOf } from './stones'

const firstEvolution = (match: (from: number, e: Evolution) => boolean) => {
  for (const from of EVOLVING_SPECIES) for (const e of evolutionsOf(from)) if (match(from, e)) return { from, evo: e }
  return undefined
}
const BY_LEVEL = firstEvolution((_, e) => e.level !== undefined)!
const BY_STONE = firstEvolution((_, e) => e.stone !== undefined)
/** Una evolución por nivel que ocupa más espacios del rancho que el de antes */
const GROWING = firstEvolution((from, e) => e.level !== undefined && slotsOf(e.into) > slotsOf(from))
const BRANCHING = EVOLVING_SPECIES.find((id) => evolutionsOf(id).length > 1)

const FROM = BY_LEVEL.from
const INTO = BY_LEVEL.evo.into
const LEVEL = BY_LEVEL.evo.level!
const NOT_INTO = SPECIES.find((sp) => sp.id !== FROM && !evolutionsOf(FROM).some((e) => e.into === sp.id))!.id

/** Partida con un Pokémon activo de `from` al nivel `level`, con ★ y PS a medias, y el dinero justo para evolucionar */
function stateReady(from = FROM, level = LEVEL, into = INTO) {
  const s = initialState()
  chooseStarter(s, from)
  const mon = s.owned[0]
  Object.assign(mon, { level, stars: 2, exp: 3 })
  mon.hp = Math.floor(maxHp(mon) / 2)
  s.money = evolvePrice(into)
  return { s, mon }
}

/** Llena el rancho del Pokémon con otros que no son su evolución */
function fillRanch(s: ReturnType<typeof stateReady>['s'], ranch: number, avoid: number) {
  const filler = SPECIES.find((sp) => sp.id !== avoid && slotsOf(sp.id) === 1)!.id
  while (usedSlots(s, ranch) < RANCH_SLOTS) s.owned.push(createMon(filler, NEW_MON_LEVEL, ranch))
}

describe('evolve', () => {
  it('al llegar a su nivel cambia de especie: conserva nivel, EXP y uid, pierde las ★ y queda con todos sus PS', () => {
    const { s, mon } = stateReady()
    const uid = mon.uid
    expect(evolve(s, uid, INTO)).toEqual({ fromId: FROM, intoId: INTO, destination: mon.ranch })
    expect(s.owned).toHaveLength(1)
    expect(s.owned[0]).toMatchObject({ uid, speciesId: INTO, level: LEVEL, exp: 3, stars: 0 })
    expect(s.owned[0].hp).toBe(maxHp(s.owned[0]))
    expect(s.activeUid).toBe(uid)
  })

  it('en la Pokédex la especie de antes vuelve a quedar solo como vista', () => {
    const { s, mon } = stateReady()
    evolve(s, mon.uid, INTO)
    expect(s.caught).toContain(INTO)
    expect(s.caught).not.toContain(FROM)
    expect(s.seen).toContain(FROM)
  })

  it('antes de su nivel no puede evolucionar', () => {
    const { s, mon } = stateReady(FROM, LEVEL - 1)
    expect(evolveBlocker(s, mon.uid, INTO)).toMatch(String(LEVEL))
    expect(evolve(s, mon.uid, INTO)).toBeNull()
    expect(mon.speciesId).toBe(FROM)
  })

  it('cobra según la rareza de la evolución y no evoluciona sin dinero suficiente', () => {
    const { s, mon } = stateReady()
    s.money = evolvePrice(INTO) - 1
    expect(evolveBlocker(s, mon.uid, INTO)).toMatch(/₽/)
    s.money = evolvePrice(INTO)
    evolve(s, mon.uid, INTO)
    expect(s.money).toBe(0)
  })

  it('no evoluciona si ya tienes esa especie', () => {
    const { s, mon } = stateReady()
    s.owned.push(createMon(INTO, NEW_MON_LEVEL, null))
    expect(evolveBlocker(s, mon.uid, INTO)).toMatch(/Ya tienes/)
  })

  it('no evoluciona a una especie que no le corresponde ni fuera del rancho o la Caja', () => {
    const { s, mon } = stateReady()
    expect(evolveBlocker(s, mon.uid, NOT_INTO)).not.toBeNull()
    s.expeditions.push({ uid: mon.uid, routeId: RouteId.PuebloPaleta, durationMin: 15, elapsedMin: 0 })
    expect(evolveBlocker(s, mon.uid, INTO)).toMatch(/rancho/)
  })

  it('en la Caja evoluciona y se queda en ella aunque los ranchos estén llenos', () => {
    const { s, mon } = stateReady()
    fillRanch(s, mon.ranch!, INTO)
    mon.ranch = null
    s.activeUid = s.owned[1].uid
    expect(evolve(s, mon.uid, INTO)?.destination).toBeNull()
    expect(mon.ranch).toBeNull()
  })

  it.runIf(GROWING)('si no cabe en su rancho va al primero con hueco, y si no cabe en ninguno no evoluciona', () => {
    const { from, evo } = GROWING!
    const { s, mon } = stateReady(from, evo.level!, evo.into)
    fillRanch(s, mon.ranch!, evo.into)
    expect(evolveBlocker(s, mon.uid, evo.into)).toMatch(/ningún rancho/)
    s.upgrades.ranches = 1
    expect(evolve(s, mon.uid, evo.into)?.destination).toBe(1)
    expect(mon).toMatchObject({ ranch: 1, spot: null })
  })

  it.runIf(BY_STONE)('por piedra evoluciona a cualquier nivel gastando la piedra y pagando su rareza', () => {
    const { from, evo } = BY_STONE!
    const { s, mon } = stateReady(from, NEW_MON_LEVEL, evo.into)
    expect(evolveBlocker(s, mon.uid, evo.into)).toMatch(/Piedra/)
    s.stones[evo.stone!] = 1
    expect(evolve(s, mon.uid, evo.into)).not.toBeNull()
    expect(stonesOf(s, evo.stone!)).toBe(0)
    expect(s.money).toBe(0)
  })

  it.runIf(BRANCHING)('con varias opciones se elige a cuál evoluciona', () => {
    const last = evolutionsOf(BRANCHING!).at(-1)!
    const { s, mon } = stateReady(BRANCHING!, last.level ?? NEW_MON_LEVEL, last.into)
    if (last.stone) s.stones[last.stone] = 1
    expect(evolve(s, mon.uid, last.into)?.intoId).toBe(last.into)
    expect(mon.speciesId).toBe(last.into)
  })
})
