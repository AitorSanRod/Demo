import { species } from '../../data/species'
import type { OwnedMon } from '../core/state'

export interface Stats {
  hp: number
  atk: number
  def: number
  spe: number
}

export const MAX_LEVEL = 100
export const MAX_STARS = 5
/** Cada estrella (duplicado del gacha) da +4% a todas las stats */
const STAR_BONUS = 0.04

export function calcStats(speciesId: number, level: number, stars = 0): Stats {
  const b = species(speciesId).base
  const mult = 1 + stars * STAR_BONUS
  const stat = (base: number) => Math.floor(((2 * base * level) / 100 + 5) * mult)
  return {
    hp: Math.floor(((2 * b.hp * level) / 100 + level + 10) * mult),
    atk: stat(b.atk),
    def: stat(b.def),
    spe: stat(b.spe),
  }
}

export function maxHp(mon: OwnedMon): number {
  return calcStats(mon.speciesId, mon.level, mon.stars).hp
}

/** Pasos por minuto: depende sobre todo de la velocidad base de la especie */
export function stepsPerMinute(mon: OwnedMon): number {
  const spe = species(mon.speciesId).base.spe
  return Math.round(12 + spe * 0.15 + mon.level * 0.25 + mon.stars)
}

/** EXP necesaria para pasar de `level` a `level + 1` (curva "media rápida") */
export function expToNext(level: number): number {
  return (level + 1) ** 3 - level ** 3
}

export interface LevelUpResult {
  levelsGained: number
}

/** Suma EXP y sube niveles. Muta `mon`. */
export function gainExp(mon: OwnedMon, amount: number): LevelUpResult {
  const startLevel = mon.level
  const oldMax = maxHp(mon)
  mon.exp += amount
  while (mon.level < MAX_LEVEL && mon.exp >= expToNext(mon.level)) {
    mon.exp -= expToNext(mon.level)
    mon.level++
  }
  if (mon.level >= MAX_LEVEL) mon.exp = 0

  // Al subir de nivel se gana la diferencia de PS máximos
  mon.hp = Math.min(maxHp(mon), mon.hp + (maxHp(mon) - oldMax))
  return { levelsGained: mon.level - startLevel }
}
