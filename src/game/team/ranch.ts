import { findMon, monPlace, type GameState, type OwnedMon } from '../core/state'
import { expToNext, gainExp, maxHp, type LevelUpResult } from './stats'

/** Fracción de PS máximos que se recupera por minuto descansando en el rancho */
export const REGEN_PER_MIN = 0.1
/** Fracción de la EXP del nivel actual que da una sesión de entrenamiento */
const TRAIN_EXP_FRACTION = 0.4

export const healCost = (m: OwnedMon) => 5 + m.level * 3
export const trainCost = (m: OwnedMon) => 20 + m.level * 8

/** El Pokémon solo se puede gestionar si está en el rancho (no en ruta ni de expedición) */
function ranchMon(s: GameState, uid: string): OwnedMon | null {
  const m = findMon(s, uid)
  return m && monPlace(s, uid) === 'ranch' ? m : null
}

export function restInRanch(s: GameState, minutes: number) {
  for (const m of s.owned) {
    if (monPlace(s, m.uid) !== 'ranch') continue
    m.hp = Math.min(maxHp(m), m.hp + maxHp(m) * REGEN_PER_MIN * minutes)
  }
}

export function healInstant(s: GameState, uid: string): boolean {
  const m = ranchMon(s, uid)
  if (!m || s.money < healCost(m) || m.hp >= maxHp(m)) return false
  s.money -= healCost(m)
  m.hp = maxHp(m)
  return true
}

export function train(s: GameState, uid: string): LevelUpResult | null {
  const m = ranchMon(s, uid)
  if (!m || s.money < trainCost(m)) return null
  s.money -= trainCost(m)
  return gainExp(m, Math.ceil(expToNext(m.level) * TRAIN_EXP_FRACTION))
}

export function setActive(s: GameState, uid: string) {
  if (s.run || !ranchMon(s, uid)) return
  s.activeUid = uid
}

