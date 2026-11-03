import { species } from '../../data/species'
import type { RaidPrize } from '../../game/raid/raidRoom'
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

/** Premios de los jefes comunitarios derrotados, sumados: cada jefe, y después ₽, tickets y tickets de cada jefe */
export function raidPrizeRewards(prizes: RaidPrize[]): RewardItem[] {
  const bosses = [...new Set(prizes.map((p) => p.bossSpeciesId))]
  const ofBoss = (id: number) => prizes.filter((p) => p.bossSpeciesId === id)
  const sum = (list: RaidPrize[], field: 'money' | 'tickets' | 'pieces') => list.reduce((a, p) => a + p[field], 0)
  const items: RewardItem[] = bosses.map((id) => ({
    key: `boss-${id}`,
    icon: <Sprite id={id} size={160} />,
    title: `¡${species(id).name} derrotado${ofBoss(id).length > 1 ? ` ×${ofBoss(id).length}` : ''}!`,
    detail: 'Jefe comunitario',
    color: '#c04040',
  }))
  items.push(...moneyAndTickets(sum(prizes, 'money'), sum(prizes, 'tickets')))
  for (const id of bosses) {
    const pieces = sum(ofBoss(id), 'pieces')
    if (pieces > 0) items.push({ key: `piece-${id}`, icon: <Sprite id={id} size={160} />, title: `Ticket de ${species(id).name} ×${pieces}`, color: '#8a5ab0' })
  }
  return items
}
