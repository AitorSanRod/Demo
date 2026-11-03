import { signatureMove } from '../../../data/moves'
import { RARITY_INFO, rarityOf, species } from '../../../data/species'
import { isSeen } from '../../../game/collection/dex'
import { MonPlace, monPlace, type GameState, type OwnedMon } from '../../../game/core/state'
import { REGEN_PER_MIN } from '../../../game/team/ranch'
import { calcStats, maxHp, stepsPerMinute } from '../../../game/team/stats'
import { MoveChip, TypeBadge } from '../common'
import { MonSection, MonStats } from './MonSheet'

const PLACE_LABEL: Record<MonPlace, string> = {
  [MonPlace.Ranch]: 'En el rancho',
  [MonPlace.Run]: 'En ruta',
  [MonPlace.Expedition]: 'De expedición',
  [MonPlace.Raid]: 'Contra el jefe',
  [MonPlace.Box]: 'En la Caja',
}

/**
 * Sección «Datos», igual en el rancho y en la Pokédex: tipos, rareza, dónde está, stats y ataque.
 * Sin `mon` (especie que aún no tienes) solo se ve lo que se sabe de la especie.
 */
export function MonOverview({ game, speciesId, mon }: { game: GameState; speciesId: number; mon?: OwnedMon }) {
  const sp = species(speciesId)
  const rarity = RARITY_INFO[rarityOf(sp)]
  const seen = isSeen(game, speciesId)
  const place = mon && monPlace(game, mon.uid)

  return (
    <MonSection title="Datos">
      <div className="mon-tags">
        {seen && sp.types.map((t) => <TypeBadge key={t} type={t} />)}
        <span className="tag" style={{ background: rarity.color }}>
          {rarity.name}
        </span>
        {mon && mon.uid === game.activeUid && <span className="tag ok">Compañero</span>}
        {place && <span className="tiny muted">{PLACE_LABEL[place]}</span>}
      </div>
      {mon && place === MonPlace.Ranch && mon.hp < maxHp(mon) && (
        <p className="tiny muted center">Descansando: +{REGEN_PER_MIN * 100}% PS por minuto</p>
      )}
      {mon ? (
        <MonStats stats={calcStats(mon.speciesId, mon.level, mon.stars)} stepsPerMin={stepsPerMinute(mon)} />
      ) : (
        seen && <p className="tiny muted center">Sus stats se ven cuando lo tengas.</p>
      )}
      {seen && <MoveChip id={signatureMove(speciesId).id} />}
    </MonSection>
  )
}
