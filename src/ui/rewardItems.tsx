import { species } from '../data/species'
import { Sprite } from './common'
import type { RewardItem } from './RewardOverlay'

interface Earnings {
  wins: number
  battles?: number
  exp: number
  money: number
  tickets: number
}

/** Premios comunes de rutas y expediciones; se omiten los que valen 0 */
export function earningsRewards({ wins, battles, exp, money, tickets }: Earnings): RewardItem[] {
  const items: RewardItem[] = [
    { key: 'wins', icon: '⚔️', title: battles ? `${wins}/${battles} victorias` : `${wins} victorias` },
  ]
  if (exp > 0) items.push({ key: 'exp', icon: '✨', title: `+${exp} EXP`, color: '#3a8fd8' })
  if (money > 0) items.push({ key: 'money', icon: '💰', title: `+₽ ${money}`, color: '#d8a020' })
  if (tickets > 0) items.push({ key: 'tickets', icon: '🎟', title: `+${tickets} ticket${tickets > 1 ? 's' : ''}`, color: '#c04040' })
  return items
}

export function levelUpReward(speciesId: number, level: number): RewardItem {
  return {
    key: 'level',
    icon: <Sprite id={speciesId} size={120} />,
    title: `¡${species(speciesId).name} sube a Nv. ${level}!`,
    color: '#40a060',
  }
}
