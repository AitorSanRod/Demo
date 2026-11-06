import { describe, expect, it, vi } from 'vitest'
import { RAID_PRIZE_TABLES, RaidPrizeKind, RaidTier } from '../../data/raidBosses'
import { boostedMoney } from '../battle/rewards'
import { isSeen } from '../collection/dex'
import { seqRng } from '../core/test-utils'
import { raidBossAt } from './raid'
import { applyPrize, collectRaidPrize, collectRaidPrizes, earnsPrize, presenceShare, RAID_MIN_PRESENCE, rollPrize } from './raidPrizes'
import { newMember, RaidMemberKind } from './raidRoom'
import { raidState } from './raid-test-utils'
import { expToNext } from '../team/stats'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const FIGHT_MS = 1_000_000
const UID = 'mon'
const member = (presentMs: number, left: boolean) => ({
  ...newMember({ id: 'a', kind: RaidMemberKind.Player, trainer: '', speciesId: 1, level: 1, stars: 0 }),
  presentMs,
  left,
})

const sumOf = (kind: RaidPrizeKind, minChance = 0, tier = raidBossAt(0).tier) =>
  RAID_PRIZE_TABLES[tier].filter((r) => r.kind === kind && r.chance >= minChance).reduce((a, r) => a + r.amount, 0)

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
    const prize = rollPrize(raidBossAt(0), UID, seqRng(0))
    expect(prize).toEqual({
      bossSpeciesId: raidBossAt(0).speciesId,
      uid: UID,
      money: boostedMoney(sumOf(RaidPrizeKind.Money)),
      tickets: sumOf(RaidPrizeKind.Tickets),
      pieces: sumOf(RaidPrizeKind.BossPieces),
      exp: sumOf(RaidPrizeKind.Exp),
    })
  })

  it('cada jefe tira la tabla de su categoría', () => {
    for (const tier of Object.values(RaidTier)) {
      const prize = rollPrize({ ...raidBossAt(0), tier }, UID, seqRng(0))
      expect(prize.money).toBe(boostedMoney(sumOf(RaidPrizeKind.Money, 0, tier)))
      expect(prize.tickets).toBe(sumOf(RaidPrizeKind.Tickets, 0, tier))
      expect(prize.pieces).toBe(sumOf(RaidPrizeKind.BossPieces, 0, tier))
      expect(prize.exp).toBe(sumOf(RaidPrizeKind.Exp, 0, tier))
    }
  })

  it('con la peor tirada solo salen las líneas seguras', () => {
    const prize = rollPrize(raidBossAt(0), UID, seqRng(0.9999))
    expect(prize.money).toBe(boostedMoney(sumOf(RaidPrizeKind.Money, 1)))
    expect(prize.tickets).toBe(sumOf(RaidPrizeKind.Tickets, 1))
    expect(prize.pieces).toBe(sumOf(RaidPrizeKind.BossPieces, 1))
    expect(prize.exp).toBe(sumOf(RaidPrizeKind.Exp, 1))
  })

  it('al recogerlo se suman ₽, tickets y tickets del jefe, que queda visto', () => {
    const { s } = raidState()
    const boss = raidBossAt(0)
    const prize = rollPrize(boss, UID, seqRng(0))
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

  it('se puede recoger uno solo; los demás siguen pendientes', () => {
    const { s } = raidState()
    const first = rollPrize(raidBossAt(0), UID, seqRng(0))
    const second = { ...first, money: first.money + 1 }
    s.raidPrizes = [first, second]
    const money = s.money
    expect(collectRaidPrize(s, 1)).toEqual(second)
    expect(s.money).toBe(money + second.money)
    expect(s.raidPrizes).toEqual([first])
    expect(collectRaidPrize(s, 5)).toBeNull()
    expect(s.raidPrizes).toHaveLength(1)
  })

  it('su EXP es para el Pokémon que luchó y devuelve los niveles que sube', () => {
    const { s, mon } = raidState()
    const startLevel = mon.level
    const prize = { ...rollPrize(raidBossAt(0), mon.uid, seqRng(0)), exp: expToNext(mon.level) }
    expect(applyPrize(s, prize)).toBe(1)
    expect(mon.level).toBe(startLevel + 1)
  })

  it('si el Pokémon que luchó ya no está, su EXP se pierde sin romper nada', () => {
    const { s } = raidState()
    const money = s.money
    const prize = rollPrize(raidBossAt(0), 'ya-no-existe', seqRng(0))
    expect(applyPrize(s, prize)).toBe(0)
    expect(s.money).toBe(money + prize.money)
  })
})
