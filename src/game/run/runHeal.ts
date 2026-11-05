import type { Route, RouteNode } from '../../data/maps'
import { POTION_INFO, type Potion } from '../../data/potions'
import { activeMon, type GameState, type OwnedMon } from '../core/state'
import { maxHp } from '../team/stats'
import { completeRoute } from './runBattle'

/** Milisegundos reales que el Pokémon se queda parado curándose en una parada de poción (lo que dura la animación) */
export const HEAL_STOP_MS = 1800

/** PS que recupera `mon` con la poción, sin pasar de sus PS máximos */
export function potionHeal(mon: OwnedMon, potion: Potion): number {
  const missing = maxHp(mon) - mon.hp
  return Math.max(0, Math.min(missing, POTION_INFO[potion].hp ?? missing))
}

/** Al llegar a una parada de curación: el Pokémon usa su poción y se queda parado HEAL_STOP_MS */
export function drinkStopPotion(s: GameState, n: RouteNode) {
  const mon = activeMon(s)!
  const potion = n.potion!
  const hp = potionHeal(mon, potion)
  mon.hp += hp
  s.run!.heal = { potion, hp, msLeft: HEAL_STOP_MS }
}

/** Gasta hasta `ms` de la parada de curación; al acabarse, sigue caminando o completa la ruta. Devuelve lo gastado */
export function spendHealTime(s: GameState, r: Route, ms: number): number {
  const run = s.run!
  const heal = run.heal!
  const spent = Math.min(ms, heal.msLeft)
  heal.msLeft -= spent
  if (heal.msLeft > 0) return spent
  run.heal = null
  if (run.stop === run.path.length - 1) completeRoute(s, r)
  return spent
}
