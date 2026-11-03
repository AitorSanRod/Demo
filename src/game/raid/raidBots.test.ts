import { describe, expect, it, vi } from 'vitest'
import { seqRng } from '../core/test-utils'
import { RAID_BOTS_MAX, RAID_BOTS_MIN, updateBots } from './raidBots'
import { RAID_ROUND_MS } from './raidCombat'
import { newMember, presentMembers, RAID_ROOM_SIZE, RaidMemberKind } from './raidRoom'
import { raidState } from './raid-test-utils'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const ALWAYS_JOIN = seqRng(0)
const NEVER_JOIN = seqRng(0.9999)

describe('bots de la sala', () => {
  it('siempre hay al menos el mínimo', () => {
    const { raid } = raidState()
    updateBots(raid, RAID_ROUND_MS, NEVER_JOIN)
    expect(presentMembers(raid)).toHaveLength(RAID_BOTS_MIN)
  })

  it('nunca pasan del máximo', () => {
    const { raid } = raidState()
    for (let i = 0; i < RAID_BOTS_MAX * 3; i++) updateBots(raid, RAID_ROUND_MS, ALWAYS_JOIN)
    expect(presentMembers(raid)).toHaveLength(RAID_BOTS_MAX)
  })

  it('se van al acabar su tiempo y entra otro en su lugar', () => {
    const { raid } = raidState()
    updateBots(raid, RAID_ROUND_MS, NEVER_JOIN)
    const first = raid.members[0]
    updateBots(raid, first.stayMs!, NEVER_JOIN)
    expect(first.left).toBe(true)
    expect(presentMembers(raid).length).toBeGreaterThanOrEqual(RAID_BOTS_MIN)
  })

  it('no entran si la sala está llena', () => {
    const { raid } = raidState()
    for (let i = 0; i < RAID_ROOM_SIZE; i++) {
      raid.members.push(newMember({ id: `p${i}`, kind: RaidMemberKind.Player, trainer: '', speciesId: 1, level: 1, stars: 0 }))
    }
    updateBots(raid, RAID_ROUND_MS, ALWAYS_JOIN)
    expect(presentMembers(raid)).toHaveLength(RAID_ROOM_SIZE)
  })
})
