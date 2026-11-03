import { describe, expect, it, vi } from 'vitest'
import { raidMinutesLeft } from './raidEstimate'
import { newMember, RaidMemberKind, type Raid } from './raidRoom'
import { raidState, sparringSpecies } from './raid-test-utils'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

function addFighter(raid: Raid, id: string) {
  const speciesId = sparringSpecies(raid.boss.speciesId)
  raid.members.push(newMember({ id, kind: RaidMemberKind.Bot, trainer: '', speciesId, level: raid.boss.level, stars: 0 }))
}

describe('tiempo estimado para tirar al jefe', () => {
  it('sin nadie en la sala no hay estimación', () => {
    const { s, raid } = raidState()
    expect(raidMinutesLeft(s, raid)).toBeNull()
  })

  it('con la misma sala sale siempre lo mismo y no la cambia', () => {
    const { s, raid } = raidState()
    addFighter(raid, 'a')
    const before = structuredClone(raid)
    expect(raidMinutesLeft(s, raid)).toBe(raidMinutesLeft(s, raid))
    expect(raid).toEqual(before)
  })

  it('con más Pokémon en la sala tarda menos', () => {
    const { s, raid } = raidState()
    addFighter(raid, 'a')
    const alone = raidMinutesLeft(s, raid)!
    addFighter(raid, 'b')
    addFighter(raid, 'c')
    expect(raidMinutesLeft(s, raid)!).toBeLessThan(alone)
  })

  it('con menos vida por quitar tarda menos', () => {
    const { s, raid } = raidState()
    addFighter(raid, 'a')
    const full = raidMinutesLeft(s, raid)!
    raid.hp = Math.round(raid.maxHp / 2)
    expect(raidMinutesLeft(s, raid)!).toBeCloseTo(full / 2)
  })
})
