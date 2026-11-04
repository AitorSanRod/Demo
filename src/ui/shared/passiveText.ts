import { STATUS_INFO, TYPE_PASSIVES, type PassiveEffect, type PassiveLevel } from '../../data/passives'
import { TYPE_INFO, type PokeType } from '../../data/types'

const pct = (fraction: number) => `${Math.round(fraction * 100)}%`

/** Lo que da una pasiva, en frases cortas («+30% ataque», «10% de quemar»…) */
function describeEffect(e: PassiveEffect): string[] {
  const parts: string[] = []
  if (e.hp) parts.push(`+${pct(e.hp)} PS`)
  if (e.atk) parts.push(`+${pct(e.atk)} ataque`)
  if (e.def) parts.push(`+${pct(e.def)} defensa`)
  if (e.spe) parts.push(`+${pct(e.spe)} velocidad`)
  if (e.inflict) parts.push(`${pct(e.inflict.chance)} de ${STATUS_INFO[e.inflict.status].name.toLowerCase()} al golpear`)
  if (e.regen) parts.push(`recupera ${pct(e.regen)} PS por turno`)
  if (e.drain) parts.push(`roba ${pct(e.drain)} del daño que hace`)
  if (e.damageReduction) parts.push(`recibe ${pct(e.damageReduction)} menos de daño`)
  if (e.dodge) parts.push(`${pct(e.dodge)} de esquivar`)
  if (e.crit) parts.push(`${pct(e.crit)} de crítico`)
  if (e.winHeal) parts.push(`cura ${pct(e.winHeal)} PS al ganar`)
  if (e.bonusVs) parts.push(`+${pct(e.bonusVs.damage)} de daño a ${e.bonusVs.types.map((t) => TYPE_INFO[t].name).join('/')}`)
  return parts
}

export const passiveText = (type: PokeType, level: PassiveLevel): string => describeEffect(TYPE_PASSIVES[type][level - 1]).join(' · ')
