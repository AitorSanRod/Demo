import type { PokeType } from './types'

// Pasivas de rancho: con varios Pokémon del mismo tipo en el rancho del activo, este gana la pasiva de ese tipo en las
// rutas. Este fichero es para editarlo a mano: umbrales, efectos de cada nivel y estados alterados.

/** Pokémon del mismo tipo que hacen falta en el rancho para el nivel 1 y el nivel 2 de su pasiva */
export const PASSIVE_THRESHOLDS = [3, 5] as const

/** Nivel de una pasiva: 1 o 2 */
export type PassiveLevel = 1 | 2

export const StatusId = { Burn: 'burn', Poison: 'poison', Paralysis: 'paralysis', Freeze: 'freeze', Confusion: 'confusion' } as const
export type StatusId = (typeof StatusId)[keyof typeof StatusId]

export interface StatusInfo {
  name: string
  /** Texto al recibirlo («se quemó») */
  verb: string
  /** Fracción de los PS máximos que pierde al final de cada turno */
  damagePerTurn?: number
  /** Multiplicador de su ataque mientras dura */
  atkMult?: number
  /** Probabilidad de no poder atacar en su turno */
  skipChance?: number
  /** Turnos que pierde seguidos; luego se le pasa */
  skipTurns?: number
  /** Probabilidad de golpearse a sí mismo en vez de atacar (con la mitad de su daño normal) */
  selfHitChance?: number
}

/** Estados alterados que pueden infligir las pasivas; duran todo el combate salvo la congelación */
export const STATUS_INFO: Record<StatusId, StatusInfo> = {
  [StatusId.Burn]: { name: 'Quemadura', verb: 'se quemó', damagePerTurn: 0.06, atkMult: 0.75 },
  [StatusId.Poison]: { name: 'Veneno', verb: 'fue envenenado', damagePerTurn: 0.08 },
  [StatusId.Paralysis]: { name: 'Parálisis', verb: 'quedó paralizado', skipChance: 0.25 },
  [StatusId.Freeze]: { name: 'Congelación', verb: 'quedó congelado', skipTurns: 1 },
  [StatusId.Confusion]: { name: 'Confusión', verb: 'quedó confuso', selfHitChance: 0.33 },
}

/**
 * Lo que da una pasiva. Las stats son fracciones que se suman (0.2 = +20%); las probabilidades, de 0 a 1.
 * Se pueden combinar varios campos en un mismo nivel.
 */
export interface PassiveEffect {
  hp?: number
  atk?: number
  def?: number
  spe?: number
  /** Probabilidad, en cada golpe que acierta, de infligir un estado al rival */
  inflict?: { status: StatusId; chance: number }
  /** Fracción de los PS máximos que recupera al final de cada turno */
  regen?: number
  /** Fracción del daño hecho que recupera como PS */
  drain?: number
  /** Fracción del daño recibido que se evita (0.2 = recibe un 20% menos) */
  damageReduction?: number
  /** Probabilidad de esquivar un ataque que iba a acertar */
  dodge?: number
  /** Probabilidad de golpe crítico (×1.5 de daño) */
  crit?: number
  /** Fracción de los PS máximos que recupera al ganar un combate (además de la cura normal) */
  winHeal?: number
  /** Más daño contra rivales de estos tipos (0.15 = +15%) */
  bonusVs?: { types: PokeType[]; damage: number }
}

/** Pasiva de cada tipo: nivel 1 y nivel 2 (el doble, salvo que se cambie aquí) */
export const TYPE_PASSIVES: Record<PokeType, [PassiveEffect, PassiveEffect]> = {
  normal: [{ hp: 0.2 }, { hp: 0.4 }],
  fire: [
    { atk: 0.3, inflict: { status: StatusId.Burn, chance: 0.1 } },
    { atk: 0.6, inflict: { status: StatusId.Burn, chance: 0.2 } },
  ],
  water: [
    { def: 0.2, regen: 0.05 },
    { def: 0.4, regen: 0.1 },
  ],
  grass: [{ drain: 0.15 }, { drain: 0.3 }],
  electric: [
    { spe: 0.2, inflict: { status: StatusId.Paralysis, chance: 0.1 } },
    { spe: 0.4, inflict: { status: StatusId.Paralysis, chance: 0.2 } },
  ],
  ice: [{ inflict: { status: StatusId.Freeze, chance: 0.1 } }, { inflict: { status: StatusId.Freeze, chance: 0.2 } }],
  fighting: [{ atk: 0.2 }, { atk: 0.4 }],
  poison: [{ inflict: { status: StatusId.Poison, chance: 0.15 } }, { inflict: { status: StatusId.Poison, chance: 0.3 } }],
  ground: [{ def: 0.25 }, { def: 0.5 }],
  flying: [{ spe: 0.25 }, { spe: 0.5 }],
  psychic: [{ inflict: { status: StatusId.Confusion, chance: 0.1 } }, { inflict: { status: StatusId.Confusion, chance: 0.2 } }],
  bug: [{ bonusVs: { types: ['grass', 'psychic'], damage: 0.15 } }, { bonusVs: { types: ['grass', 'psychic'], damage: 0.3 } }],
  rock: [{ damageReduction: 0.2 }, { damageReduction: 0.4 }],
  ghost: [{ dodge: 0.15 }, { dodge: 0.3 }],
  dragon: [
    { hp: 0.15, atk: 0.15, def: 0.15, spe: 0.15 },
    { hp: 0.3, atk: 0.3, def: 0.3, spe: 0.3 },
  ],
  dark: [{ crit: 0.15 }, { crit: 0.3 }],
  steel: [{ damageReduction: 0.25 }, { damageReduction: 0.5 }],
  fairy: [{ winHeal: 0.25 }, { winHeal: 0.5 }],
}

/** Una pasiva concreta: de qué tipo y de qué nivel (en los jefes se escriben a mano en el mapa) */
export interface PassiveRef {
  type: PokeType
  level: PassiveLevel
}

/** Multiplicador de daño de un golpe crítico */
export const CRIT_MULT = 1.5
