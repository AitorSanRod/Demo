import { describe, expect, it, vi } from 'vitest'
import { RouteId } from '../../data/maps'
import { RAID_PRIZE_TABLE, RaidPrizeKind } from '../../data/raidBosses'
import { isSeen } from '../collection/dex'
import { seqRng } from '../core/test-utils'
import { raidBossAt } from './raid'
import { collectRaidPrizes, earnsPrize, presenceShare, RAID_MIN_PRESENCE, rollPrize, routeRaidPrizes } from './raidPrizes'
import { newMember, RaidMemberKind } from './raidRoom'
import { raidState } from './raid-test-utils'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const FIGHT_MS = 1_000_000
const member = (presentMs: number, left: boolean) => ({
  ...newMember({ id: 'a', kind: RaidMemberKind.Player, trainer: '', speciesId: 1, level: 1, stars: 0 }),
  presentMs,
  left,
})

const sumOf = (kind: RaidPrizeKind, minChance = 0) =>
  RAID_PRIZE_TABLE.filter((r) => r.kind === kind && r.chance >= minChance).reduce((a, r) => a + r.amount, 0)

describe('premio del jefe', () => {
  it('cobra quien seguía dentro al caer, aunque llegara al final', () => {
    expect(earnsPrize(member(0, false), FIGHT_MS)).toBe(true)
  })

  it('quien se fue cobra solo si estuvo el mínimo de la pelea', () => {
    const minimum = FIGHT_MS * RAID_MIN_PRESENCE
    expect(earnsPrize(member(minimum, true), FIGHT_MS)).toBe(true)
    expect(earnsPrize(member(minimum - 1, true), FIGHT_MS)).toBe(false)
  })

  it('la participación es la fracción de la pelea que lleva dentro', () => {
    expect(presenceShare(member(FIGHT_MS / 4, false), FIGHT_MS)).toBe(0.25)
    expect(presenceShare(member(0, false), 0)).toBe(1)
  })

  it('con la mejor tirada salen todas las líneas de la tabla', () => {
    const prize = rollPrize(raidBossAt(0), seqRng(0))
    expect(prize).toEqual({
      bossSpeciesId: raidBossAt(0).speciesId,
      money: sumOf(RaidPrizeKind.Money),
      tickets: sumOf(RaidPrizeKind.Tickets),
      pieces: sumOf(RaidPrizeKind.BossPieces),
    })
  })

  it('con la peor tirada solo salen las líneas seguras', () => {
    const prize = rollPrize(raidBossAt(0), seqRng(0.9999))
    expect(prize.money).toBe(sumOf(RaidPrizeKind.Money, 1))
    expect(prize.tickets).toBe(sumOf(RaidPrizeKind.Tickets, 1))
    expect(prize.pieces).toBe(sumOf(RaidPrizeKind.BossPieces, 1))
  })

  it('al recogerlo se suman ₽, tickets y tickets del jefe, que queda visto', () => {
    const { s } = raidState()
    const boss = raidBossAt(0)
    const prize = rollPrize(boss, seqRng(0))
    s.raidPrizes = [prize, prize]
    const money = s.money
    const tickets = s.tickets
    expect(collectRaidPrizes(s)).toHaveLength(2)
    expect(s.money).toBe(money + prize.money * 2)
    expect(s.tickets).toBe(tickets + prize.tickets * 2)
    expect(s.pieces[boss.speciesId] ?? 0).toBe(prize.pieces * 2)
    expect(isSeen(s, boss.speciesId)).toBe(true)
    expect(s.raidPrizes).toHaveLength(0)
  })

  it('desde una ruta se recogen solo los premios de los jefes que vivían en ella', () => {
    const { s } = raidState()
    const optional = rollPrize(raidBossAt(0), seqRng(0))
    const fromRoute = rollPrize({ ...raidBossAt(0), routeId: RouteId.Ruta1 }, seqRng(0))
    s.raidPrizes = [optional, fromRoute]
    expect(routeRaidPrizes(s, RouteId.Ruta1)).toEqual([fromRoute])
    expect(collectRaidPrizes(s, RouteId.Ruta1)).toEqual([fromRoute])
    expect(s.raidPrizes).toEqual([optional])
  })
})
