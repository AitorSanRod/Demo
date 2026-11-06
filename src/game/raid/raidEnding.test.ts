import { describe, expect, it } from 'vitest'
import { RAID_ROUND_MS } from './raidCombat'
import { beginEnding, inFinale, isEnding, RAID_ENDING_MS, RAID_FINALE_MS, spendEnding } from './raidEnding'
import { raidState } from './raid-test-utils'

describe('final de la pelea', () => {
  it('al empezar, la última ronda se vuelve a ver desde el principio', () => {
    const { raid } = raidState()
    raid.roundMsLeft = 1
    beginEnding(raid)
    expect(isEnding(raid)).toBe(true)
    expect(raid.roundMsLeft).toBe(RAID_ROUND_MS)
    expect(inFinale(raid)).toBe(false)
  })

  it('empezarlo otra vez no lo alarga', () => {
    const { raid } = raidState()
    beginEnding(raid)
    spendEnding(raid, RAID_ROUND_MS)
    beginEnding(raid)
    expect(inFinale(raid)).toBe(true)
  })

  it('el reloj de la ronda corre con él y, tras la ronda, queda el cierre', () => {
    const { raid } = raidState()
    beginEnding(raid)
    expect(spendEnding(raid, RAID_ROUND_MS)).toBeNull()
    expect(raid.roundMsLeft).toBe(0)
    expect(inFinale(raid)).toBe(true)
  })

  it('al terminar devuelve lo que sobra', () => {
    const { raid } = raidState()
    beginEnding(raid)
    expect(spendEnding(raid, RAID_ENDING_MS + 5)).toBe(5)
    expect(isEnding(raid)).toBe(false)
    expect(RAID_FINALE_MS).toBeGreaterThan(0)
  })
})
