import type { GameState } from './state'

export type UpgradeId = 'expeditionSlots'

export interface UpgradeInfo {
  name: string
  icon: string
  description: string
  /** Precio en ₽ de cada nivel; la longitud de la lista es el nivel máximo */
  prices: number[]
}

export const UPGRADES: Record<UpgradeId, UpgradeInfo> = {
  expeditionSlots: {
    name: 'Espacio de expedición',
    icon: '🧭',
    description: '+1 Pokémon de expedición a la vez',
    prices: [500],
  },
}

export const UPGRADE_IDS = Object.keys(UPGRADES) as UpgradeId[]

export const upgradeLevel = (s: GameState, id: UpgradeId): number => s.upgrades[id] ?? 0

/** Precio del siguiente nivel, o null si ya está al máximo */
export function nextUpgradePrice(s: GameState, id: UpgradeId): number | null {
  return UPGRADES[id].prices[upgradeLevel(s, id)] ?? null
}

export function buyUpgrade(s: GameState, id: UpgradeId): boolean {
  const price = nextUpgradePrice(s, id)
  if (price === null || s.money < price) return false
  s.money -= price
  s.upgrades[id] = upgradeLevel(s, id) + 1
  return true
}
