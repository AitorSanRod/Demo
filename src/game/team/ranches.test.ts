import { describe, expect, it } from 'vitest'
import { RouteId } from '../../data/maps'
import { SPECIES } from '../../data/species'
import { initialState, MonPlace, monPlace } from '../core/state'
import { chooseStarter, seqRng } from '../core/test-utils'
import { startRun } from '../run/run'
import { createMon, NEW_MON_LEVEL } from './mons'
import { BOX_SLOTS, boxedMons, fitsInRanch, moveBlocker, moveMon, placeMon, RANCH_SLOTS, ranchCount, ranchWithRoom, slotsOf, usedSlots } from './ranches'

const [ONE_SLOT, BIG] = [SPECIES.find((sp) => slotsOf(sp.id) === 1)!.id, SPECIES.find((sp) => slotsOf(sp.id) > 1)!.id]

/** Partida con un activo y `extra` Pokémon de 1 espacio más en el primer rancho */
function stateWithTeam(extra = 1) {
  const s = initialState()
  chooseStarter(s, ONE_SLOT)
  for (let i = 0; i < extra; i++) s.owned.push(createMon(ONE_SLOT, NEW_MON_LEVEL))
  return s
}

const fillRanch = (s: ReturnType<typeof initialState>, ranch = 0) => {
  while (usedSlots(s, ranch) < RANCH_SLOTS) s.owned.push(createMon(ONE_SLOT, NEW_MON_LEVEL, ranch))
}

describe('espacios del rancho', () => {
  it('cada Pokémon ocupa los espacios de su rareza', () => {
    const s = stateWithTeam(0)
    s.owned.push(createMon(BIG, NEW_MON_LEVEL))
    expect(usedSlots(s, 0)).toBe(slotsOf(ONE_SLOT) + slotsOf(BIG))
  })

  it('los que están fuera siguen ocupando su espacio', () => {
    const s = stateWithTeam()
    const before = usedSlots(s, 0)
    startRun(s, RouteId.PuebloPaleta)
    s.expeditions.push({ uid: s.owned[1].uid, routeId: RouteId.PuebloPaleta, durationMin: 15, elapsedMin: 0 })
    expect(usedSlots(s, 0)).toBe(before)
  })

  it('un rancho lleno no admite más; se usa el siguiente si se ha comprado', () => {
    const s = stateWithTeam(0)
    fillRanch(s)
    expect(fitsInRanch(s, 0, ONE_SLOT)).toBe(false)
    expect(ranchWithRoom(s, ONE_SLOT)).toBeNull()
    s.upgrades.ranches = 1
    expect(ranchCount(s)).toBe(2)
    expect(ranchWithRoom(s, ONE_SLOT)).toBe(1)
  })

  it('lo que se libera a la vez cuenta como hueco', () => {
    const s = stateWithTeam(0)
    fillRanch(s)
    expect(fitsInRanch(s, 0, ONE_SLOT, slotsOf(ONE_SLOT))).toBe(true)
  })
})

describe('moveMon', () => {
  it('a la Caja: queda guardado y no cuenta en el rancho', () => {
    const s = stateWithTeam()
    const mon = s.owned[1]
    expect(moveMon(s, mon.uid, null)).toBe(true)
    expect(monPlace(s, mon.uid)).toBe(MonPlace.Box)
    expect(boxedMons(s)).toEqual([mon])
    expect(usedSlots(s, 0)).toBe(slotsOf(ONE_SLOT))
  })

  it(`la Caja admite ${BOX_SLOTS} Pokémon, ocupen lo que ocupen en el rancho`, () => {
    const s = stateWithTeam(BOX_SLOTS + 1)
    for (const m of s.owned.slice(1, BOX_SLOTS + 1)) expect(moveMon(s, m.uid, null)).toBe(true)
    expect(moveBlocker(s, s.owned[BOX_SLOTS + 1].uid, null)).toMatch(/llena/)
  })

  it('si se guarda el activo, pasa a serlo otro del rancho al azar', () => {
    const s = stateWithTeam(2)
    const [active, , last] = s.owned
    moveMon(s, active.uid, null, seqRng(0.99))
    expect(s.activeUid).toBe(last.uid)
  })

  it('no guarda al activo si no hay nadie más en el rancho', () => {
    const s = stateWithTeam(0)
    expect(moveBlocker(s, s.owned[0].uid, null)).not.toBeNull()
    expect(moveMon(s, s.owned[0].uid, null)).toBe(false)
  })

  it('a otro rancho solo si es tuyo y cabe; los que están fuera no se mueven', () => {
    const s = stateWithTeam()
    const mon = s.owned[1]
    expect(moveMon(s, mon.uid, 1)).toBe(false)
    s.upgrades.ranches = 1
    fillRanch(s, 1)
    expect(moveBlocker(s, mon.uid, 1)).toMatch(/cabe/)
    s.owned = s.owned.filter((m) => m.ranch !== 1)
    s.expeditions.push({ uid: mon.uid, routeId: RouteId.PuebloPaleta, durationMin: 15, elapsedMin: 0 })
    expect(moveBlocker(s, mon.uid, 1)).toMatch(/fuera/)
    s.expeditions = []
    expect(moveMon(s, mon.uid, 1)).toBe(true)
    expect(mon.ranch).toBe(1)
  })

  it('de la Caja vuelve a un rancho con hueco', () => {
    const s = stateWithTeam()
    const mon = s.owned[1]
    moveMon(s, mon.uid, null)
    expect(moveMon(s, mon.uid, 0)).toBe(true)
    expect(monPlace(s, mon.uid)).toBe(MonPlace.Ranch)
  })
})

describe('placeMon', () => {
  it('guarda dónde se suelta, dentro del prado', () => {
    const s = stateWithTeam()
    const mon = s.owned[1]
    placeMon(s, mon.uid, { x: 30, y: 140 })
    expect(mon.spot).toEqual({ x: 30, y: 100 })
    moveMon(s, mon.uid, null)
    expect(mon.spot).toBeNull()
  })
})
