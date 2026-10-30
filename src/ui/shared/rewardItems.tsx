import { species } from '../../data/species'
import { Sprite } from './common'
import type { RewardItem } from './RewardOverlay'

interface Earnings {
  wins: number
  battles?: number
  exp: number
  money: number
  tickets: number
  pieces: number[]
}

/**
 * Premios comunes de rutas y expediciones; se omiten los que valen 0. Con `seen`, las piezas de especies que no
 * estén en la lista salen en silueta y sin nombre; sin él se muestran todas (en ruta siempre se han visto).
 */
export function earningsRewards({ wins, battles, exp, money, tickets, pieces }: Earnings, seen?: number[]): RewardItem[] {
  const items: RewardItem[] = [
    { key: 'wins', icon: '⚔️', title: battles ? `${wins}/${battles} victorias` : `${wins} victorias` },
  ]
  if (exp > 0) items.push({ key: 'exp', icon: '✨', title: `+${exp} EXP`, color: '#3a8fd8' })
  if (money > 0) items.push({ key: 'money', icon: '💰', title: `+₽ ${money}`, color: '#d8a020' })
  if (tickets > 0) items.push({ key: 'tickets', icon: '🎟', title: `+${tickets} ticket${tickets > 1 ? 's' : ''}`, color: '#c04040' })
  for (const id of new Set(pieces)) {
    const count = pieces.filter((p) => p === id).length
    const known = !seen || seen.includes(id)
    items.push({
      key: `piece-${id}`,
      icon: <Sprite id={id} size={160} silhouette={!known} />,
      title: `🧩 ${known ? species(id).name : '???'} ×${count}`,
      detail: 'Pieza soltada en combate',
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
