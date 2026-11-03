import { describe, expect, it, vi } from 'vitest'
import { seqRng } from '../core/test-utils'
import { calcStats } from '../team/stats'
import { elapseRound, playRound, RAID_BOSS_MAX_HIT, RAID_REVIVE_MS, RAID_ROUND_MS } from './raidCombat'
import { BOSS_ID, newMember, RaidMemberKind, type Raid } from './raidRoom'
import { raidState, sparringSpecies } from './raid-test-utils'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const noPassives = () => []

/** Sala con un solo bot que puede herir al jefe y al que el jefe puede herir */
function soloRaid(hpFraction = 1): Raid {
  const { raid } = raidState()
  const speciesId = sparringSpecies(raid.boss.speciesId)
  raid.members = [newMember({ id: 'a', kind: RaidMemberKind.Bot, trainer: '', speciesId, level: raid.boss.level, stars: 0 }, hpFraction)]
  return raid
}

describe('rondas contra el jefe', () => {
  it('el participante pega al jefe y el jefe le pega a él', () => {
    const raid = soloRaid()
    const hits = playRound(raid, noPassives, seqRng(0))
    const dealt = hits.find((h) => h.to === BOSS_ID)!.dealt
    expect(dealt).toBeGreaterThan(0)
    expect(raid.hp).toBe(raid.maxHp - dealt)
    expect(raid.members[0].damage).toBe(dealt)
    expect(hits.some((h) => h.from === BOSS_ID && h.to === 'a')).toBe(true)
  })

  it('si el jefe lo debilita, espera RAID_REVIVE_MS y vuelve con todos sus PS', () => {
    const raid = soloRaid(0.0001)
    playRound(raid, noPassives, seqRng(0))
    const m = raid.members[0]
    expect(m.hpFraction).toBe(0)
    expect(m.downMs).toBe(RAID_REVIVE_MS)
    for (let t = 0; t < RAID_REVIVE_MS; t += RAID_ROUND_MS) elapseRound(raid)
    expect(m.downMs).toBe(0)
    expect(m.hpFraction).toBe(1)
  })

  it('el jefe no quita más de RAID_BOSS_MAX_HIT de los PS de un golpe, aunque el Pokémon sea muy débil', () => {
    const raid = soloRaid()
    const m = raid.members[0]
    m.level = 1
    const maxHp = calcStats(m.speciesId, m.level).hp
    playRound(raid, noPassives, seqRng(0))
    expect(Math.round((1 - m.hpFraction) * maxHp)).toBe(Math.ceil(maxHp * RAID_BOSS_MAX_HIT))
    expect(m.downMs).toBe(0)
  })

  it('un debilitado no pega', () => {
    const raid = soloRaid()
    raid.members[0].downMs = RAID_REVIVE_MS
    expect(playRound(raid, noPassives, seqRng(0))).toHaveLength(0)
    expect(raid.hp).toBe(raid.maxHp)
  })

  it('solo cuenta la presencia de los que siguen en la sala', () => {
    const raid = soloRaid()
    raid.members.push({ ...raid.members[0], id: 'b', left: true })
    elapseRound(raid)
    expect(raid.members.map((m) => m.presentMs)).toEqual([RAID_ROUND_MS, 0])
  })
})
