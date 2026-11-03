import { TYPE_PASSIVES, type PassiveRef, type StatusId } from '../../data/passives'
import type { PokeType } from '../../data/types'

/** Todas las pasivas de un combatiente sumadas: los porcentajes se suman y los estados y bonos por tipo se acumulan */
export interface CombatBonus {
  hp: number
  atk: number
  def: number
  spe: number
  inflicts: { status: StatusId; chance: number }[]
  regen: number
  drain: number
  damageReduction: number
  dodge: number
  crit: number
  winHeal: number
  bonusVs: { types: PokeType[]; damage: number }[]
}

/** Tope de reducción de daño, esquiva y crítico, para que ningún combate quede decidido de antemano */
const MAX_CHANCE = 0.9

const NO_BONUS: CombatBonus = {
  hp: 0,
  atk: 0,
  def: 0,
  spe: 0,
  inflicts: [],
  regen: 0,
  drain: 0,
  damageReduction: 0,
  dodge: 0,
  crit: 0,
  winHeal: 0,
  bonusVs: [],
}

/** Suma de las pasivas; la reducción de daño, la esquiva y el crítico no pasan del 90% */
export function combineBonus(passives: PassiveRef[]): CombatBonus {
  const total = structuredClone(NO_BONUS)
  for (const { type, level } of passives) {
    const e = TYPE_PASSIVES[type][level - 1]
    total.hp += e.hp ?? 0
    total.atk += e.atk ?? 0
    total.def += e.def ?? 0
    total.spe += e.spe ?? 0
    total.regen += e.regen ?? 0
    total.drain += e.drain ?? 0
    total.damageReduction += e.damageReduction ?? 0
    total.dodge += e.dodge ?? 0
    total.crit += e.crit ?? 0
    total.winHeal += e.winHeal ?? 0
    if (e.inflict) total.inflicts.push(e.inflict)
    if (e.bonusVs) total.bonusVs.push(e.bonusVs)
  }
  total.damageReduction = Math.min(MAX_CHANCE, total.damageReduction)
  total.dodge = Math.min(MAX_CHANCE, total.dodge)
  total.crit = Math.min(MAX_CHANCE, total.crit)
  return total
}

/** Multiplicador de daño extra contra un rival de estos tipos */
export const bonusVsMult = (bonus: CombatBonus, defender: PokeType[]): number =>
  1 + bonus.bonusVs.filter((b) => b.types.some((t) => defender.includes(t))).reduce((sum, b) => sum + b.damage, 0)
