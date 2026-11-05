import { findMon, MonPlace, monPlace, type GameState, type OwnedMon } from '../core/state'
import { expToNext, gainExp, MAX_LEVEL, maxHp, type LevelUpResult } from './stats'

/** Fracción de PS máximos que se recupera por minuto descansando en el rancho */
export const REGEN_PER_MIN = 0.1
/** Fracción de la EXP del nivel actual que da una sesión de entrenamiento (0.25: 4 sesiones por nivel) */
const TRAIN_EXP_FRACTION = 0.25
/** ₽ fijos de cada sesión de entrenamiento */
export const TRAIN_BASE_COST = 10
/** ₽ de cada sesión por nivel elevado a TRAIN_COST_EXPONENT */
export const TRAIN_COST_PER_LEVEL = 3
/**
 * Cómo se curva el precio con el nivel: por encima de 1 crece algo más deprisa que el dinero de las rutas (que crece
 * en línea recta con el nivel), así que el tiempo para pagar un nivel sube poco a poco sin estancarse
 */
export const TRAIN_COST_EXPONENT = 1.3

export const healCost = (m: OwnedMon) => 5 + m.level * 3
const trainExp = (m: OwnedMon) => Math.ceil(expToNext(m.level) * TRAIN_EXP_FRACTION)

export const trainCost = (m: OwnedMon): number => Math.round(TRAIN_BASE_COST + TRAIN_COST_PER_LEVEL * m.level ** TRAIN_COST_EXPONENT)

/** El Pokémon solo se puede gestionar si está en el rancho (no en ruta ni de expedición) */
function ranchMon(s: GameState, uid: string): OwnedMon | null {
  const m = findMon(s, uid)
  return m && monPlace(s, uid) === MonPlace.Ranch ? m : null
}

export function restInRanch(s: GameState, minutes: number) {
  for (const m of s.owned) {
    if (monPlace(s, m.uid) !== MonPlace.Ranch) continue
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

/** Resultado de entrenar varias sesiones seguidas, para enseñarlo antes de aceptar */
export interface TrainPlan {
  sessions: number
  /** ₽ en total: cada sesión cuesta según el nivel que tenga al empezarla */
  cost: number
  level: number
  exp: number
  levelsGained: number
}

/** Una sesión: cobra y da EXP según su nivel actual */
function trainOnce(m: OwnedMon): number {
  const cost = trainCost(m)
  gainExp(m, trainExp(m))
  return cost
}

/** Qué pasaría al entrenar `sessions` veces seguidas, sin tocar al Pokémon */
export function trainPlan(m: OwnedMon, sessions: number): TrainPlan {
  const preview = structuredClone(m)
  let cost = 0
  for (let i = 0; i < sessions; i++) cost += trainOnce(preview)
  return { sessions, cost, level: preview.level, exp: preview.exp, levelsGained: preview.level - m.level }
}

/** Sesiones seguidas que se pueden pagar ahora sin pasar del nivel máximo (0 si no puede entrenar) */
export function maxTrainSessions(s: GameState, uid: string): number {
  const m = ranchMon(s, uid)
  if (!m) return 0
  const preview = structuredClone(m)
  let sessions = 0
  let cost = 0
  while (preview.level < MAX_LEVEL && cost + trainCost(preview) <= s.money) {
    cost += trainOnce(preview)
    sessions++
  }
  return sessions
}

export function train(s: GameState, uid: string, sessions = 1): LevelUpResult | null {
  const m = ranchMon(s, uid)
  if (!m || sessions < 1 || sessions > maxTrainSessions(s, uid)) return null
  const startLevel = m.level
  for (let i = 0; i < sessions; i++) s.money -= trainOnce(m)
  return { levelsGained: m.level - startLevel }
}

export function setActive(s: GameState, uid: string) {
  if (s.run || !ranchMon(s, uid)) return
  s.activeUid = uid
}

