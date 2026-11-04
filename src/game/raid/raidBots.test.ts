import { describe, expect, it, vi } from 'vitest'
import { seqRng } from '../core/test-utils'
import { RAID_BOTS, updateBots } from './raidBots'
import { RAID_ROUND_MS } from './raidCombat'
import { newMember, presentMembers, RAID_ROOM_SIZE, RaidMemberKind } from './raidRoom'
import { raidState } from './raid-test-utils'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const ALWAYS_JOIN = seqRng(0)
const NEVER_JOIN = seqRng(0.9999)

describe('bots de la sala', () => {
  it('siempre hay al menos el mínimo', () => {
    const { raid } = raidState()
    updateBots(raid, RAID_ROUND_MS, RAID_BOTS, NEVER_JOIN)
    expect(presentMembers(raid)).toHaveLength(RAID_BOTS.min)
  })

  it('nunca pasan del máximo', () => {
    const { raid } = raidState()
    for (let i = 0; i < RAID_BOTS.max * 3; i++) updateBots(raid, RAID_ROUND_MS, RAID_BOTS, ALWAYS_JOIN)
    expect(presentMembers(raid)).toHaveLength(RAID_BOTS.max)
  })

  it('se van al acabar su tiempo y entra otro en su lugar', () => {
    const { raid } = raidState()
    updateBots(raid, RAID_ROUND_MS, RAID_BOTS, NEVER_JOIN)
    const first = raid.members[0]
    updateBots(raid, first.stayMs!, RAID_BOTS, NEVER_JOIN)
    expect(first.left).toBe(true)
    expect(presentMembers(raid).length).toBeGreaterThanOrEqual(RAID_BOTS.min)
  })

  it('si pasa el tope de minutos sin que entre ninguno, entra uno seguro', () => {
    const { raid } = raidState()
    const gapMs = RAID_BOTS.maxGapMinutes! * 60_000
    updateBots(raid, RAID_ROUND_MS, RAID_BOTS, NEVER_JOIN)
    const before = presentMembers(raid).length
    for (let t = RAID_ROUND_MS; t < gapMs; t += RAID_ROUND_MS) updateBots(raid, RAID_ROUND_MS, RAID_BOTS, NEVER_JOIN)
    expect(presentMembers(raid).length).toBe(before)
    updateBots(raid, RAID_ROUND_MS, RAID_BOTS, NEVER_JOIN)
    expect(presentMembers(raid).length).toBe(before + 1)
    expect(raid.sinceBotMs).toBe(0)
  })

  it('no entran si la sala está llena', () => {
    const { raid } = raidState()
    for (let i = 0; i < RAID_ROOM_SIZE; i++) {
      raid.members.push(newMember({ id: `p${i}`, kind: RaidMemberKind.Player, trainer: '', speciesId: 1, level: 1, stars: 0 }))
    }
    updateBots(raid, RAID_ROUND_MS, RAID_BOTS, ALWAYS_JOIN)
    expect(presentMembers(raid)).toHaveLength(RAID_ROOM_SIZE)
  })
})
