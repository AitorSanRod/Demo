import type { CSSProperties } from 'react'
import { POTION_INFO } from '../../data/potions'
import type { StopHeal } from '../../game/core/state'
import { HEAL_STOP_MS } from '../../game/run/runHeal'
import { ItemIcon } from '../shared/ItemIcon'
import './heal-stop.css'

/** Destellos que suben alrededor del Pokémon mientras se cura */
const SPARKLES = 8

/**
 * Parada de curación: la poción aparece sobre el Pokémon, se vuelca y suben destellos verdes con los PS recuperados.
 * Dura lo mismo que la parada (HEAL_STOP_MS); el Pokémon brilla con la clase `healing` de la escena
 */
export function HealStop({ heal }: { heal: StopHeal }) {
  const style = { ['--heal-ms' as string]: `${HEAL_STOP_MS}ms` } as CSSProperties
  return (
    <div className="heal-stop" style={style}>
      <div className="heal-potion">
        <ItemIcon item={heal.potion} size={48} />
      </div>
      {Array.from({ length: SPARKLES }, (_, i) => (
        <span key={i} className="heal-sparkle" style={{ ['--i' as string]: i } as CSSProperties} />
      ))}
      <span className="heal-amount">
        {heal.hp > 0 ? `+${heal.hp} PS` : 'PS al máximo'}
        <small>{POTION_INFO[heal.potion].name}</small>
      </span>
    </div>
  )
}
