import type { DailyGift } from '../../data/dailyGifts'
import { species } from '../../data/species'
import type { RaidPrize } from '../../game/raid/raidRoom'
import { ROUTE_RAID_STREAK_RESET_MS } from '../../game/raid/routeRaidStreak'
import { Sprite } from './common'
import type { RewardItem } from './RewardOverlay'
import { ICON } from './icons'
import { ItemIcon } from './ItemIcon'

interface Earnings {
  wins: number
  battles?: number
  exp: number
  money: number
  tickets: number
  pieces: number[]
}

/** ₽ y tickets de gacha ganados; se omiten los que valen 0 */
function moneyAndTickets(money: number, tickets: number): RewardItem[] {
  const items: RewardItem[] = []
  if (money > 0) items.push({ key: 'money', icon: <ItemIcon item={ICON.Money} size={96} />, title: `+₽ ${money}`, color: '#d8a020' })
  if (tickets > 0) items.push({ key: 'tickets', icon: <ItemIcon item={ICON.Ticket} size={96} />, title: `+${tickets} ticket${tickets > 1 ? 's' : ''} de gacha`, color: '#c04040' })
  return items
}

/**
 * Premios comunes de rutas y expediciones; se omiten los que valen 0. Con `seen`, las piezas de especies que no
 * estén en la lista salen en silueta y sin nombre; sin él se muestran todas (en ruta siempre se han visto).
 */
export function earningsRewards({ wins, battles, exp, money, tickets, pieces }: Earnings, seen?: number[]): RewardItem[] {
  const items: RewardItem[] = [
    { key: 'wins', icon: <ItemIcon item={ICON.Wins} size={96} />, title: battles ? `${wins}/${battles} victorias` : `${wins} victorias` },
  ]
  if (exp > 0) items.push({ key: 'exp', icon: <ItemIcon item={ICON.Exp} size={96} />, title: `+${exp} EXP`, color: '#3a8fd8' })
  items.push(...moneyAndTickets(money, tickets))
  for (const id of new Set(pieces)) {
    const count = pieces.filter((p) => p === id).length
    const known = !seen || seen.includes(id)
    items.push({
      key: `piece-${id}`,
      icon: <Sprite id={id} size={160} silhouette={!known} />,
      title: `Ticket de ${known ? species(id).name : '???'} ×${count}`,
      detail: 'Soltado en combate',
      color: '#8a5ab0',
    })
  }
  return items
}

export function levelUpReward(speciesId: number, level: number): RewardItem {
  return {
    key: 'level',
    icon: <Sprite id={speciesId} size={160} />,
    title: `¡${species(speciesId).name} sube a Nv. ${level}!`,
    color: '#40a060',
  }
}

/** Especie vista por primera vez en una expedición */
export function discoveryReward(speciesId: number): RewardItem {
  return {
    key: `discovered-${speciesId}`,
    icon: <Sprite id={speciesId} size={160} />,
    title: `¡${species(speciesId).name} descubierto!`,
    detail: 'Nuevo en la Pokédex',
    color: '#2f9e8f',
  }
}

/** Jefe comunitario derrotado (`count` veces) */
export function raidBossReward(speciesId: number, count = 1): RewardItem {
  return {
    key: `boss-${speciesId}`,
    icon: <Sprite id={speciesId} size={160} />,
    title: `¡${species(speciesId).name} derrotado${count > 1 ? ` ×${count}` : ''}!`,
    detail: 'Jefe comunitario',
    color: '#c04040',
  }
}

/** Aviso de que el jefe de una parada da menos dinero por repetir la ruta seguida */
export function repeatNote(mult: number): string {
  const minutes = ROUTE_RAID_STREAK_RESET_MS / 60000
  return `Repetida seguida: el jefe da el ${Math.round(mult * 100)}% de su dinero. Vuelve al 100% si pasan ${minutes} min sin derrotarlo.`
}

/** Lo que da un obsequio diario: ₽, tickets y trozos de MissingNo */
export function giftRewards(gift: DailyGift): RewardItem[] {
  const items = moneyAndTickets(gift.money, gift.tickets)
  if (gift.missingnoShards > 0) {
    items.push({ key: 'shards', icon: <ItemIcon item={ICON.Shard} size={96} />, title: `+${gift.missingnoShards} trozos de MissingNo`, color: '#7a5ab0' })
  }
  return items
}

/** Premios de los jefes comunitarios derrotados, sumados: cada jefe, y después EXP, ₽, tickets y tickets de cada jefe */
export function raidPrizeRewards(prizes: RaidPrize[]): RewardItem[] {
  const bosses = [...new Set(prizes.map((p) => p.bossSpeciesId))]
  const ofBoss = (id: number) => prizes.filter((p) => p.bossSpeciesId === id)
  const sum = (list: RaidPrize[], field: 'money' | 'tickets' | 'pieces' | 'exp') => list.reduce((a, p) => a + p[field], 0)
  const items = bosses.map((id) => raidBossReward(id, ofBoss(id).length))
  const exp = sum(prizes, 'exp')
  if (exp > 0) items.push({ key: 'exp', icon: <ItemIcon item={ICON.Exp} size={96} />, title: `+${exp} EXP`, color: '#3a8fd8' })
  items.push(...moneyAndTickets(sum(prizes, 'money'), sum(prizes, 'tickets')))
  for (const id of bosses) {
    const pieces = sum(ofBoss(id), 'pieces')
    if (pieces > 0) items.push({ key: `piece-${id}`, icon: <Sprite id={id} size={160} />, title: `Ticket de ${species(id).name} ×${pieces}`, color: '#8a5ab0' })
  }
  return items
}
