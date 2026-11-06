import { species } from '../../data/species'
import type { Raid } from '../../game/raid/raidRoom'
import './raid-finale.css'

/**
 * Cartel del final de la pelea contra el jefe comunitario (ver game/raid/raidEnding.ts): si ha caído el jefe, la
 * victoria; si no, el Pokémon del jugador se ha quedado sin vidas y vuelve al principio de la ruta
 */
export function RaidFinale({ raid }: { raid: Raid }) {
  const won = raid.hp === 0
  return (
    <div className={`raid-finale ${won ? 'won' : 'lost'}`}>
      <strong>{won ? `¡${species(raid.boss.speciesId).name} derrotado!` : '¡Sin vidas!'}</strong>
      <span>{won ? 'Repartiendo los premios…' : 'Tu Pokémon vuelve al principio de la ruta'}</span>
    </div>
  )
}
