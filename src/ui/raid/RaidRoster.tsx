import { species } from '../../data/species'
import { PLAYER_TRAINER } from '../../game/raid/raidEngine'
import { RaidMemberKind, rosterMembers, type Raid, type RaidMember } from '../../game/raid/raidRoom'
import { nickname } from '../../net/identity'
import { BackdropRow } from '../route/RouteRow'
import { Bar, Sprite } from '../shared/common'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { TYPE_SCENERY } from '../shared/sheet/scenery'
import './raid-roster.css'

/**
 * Quién hay en la sala, una línea por Pokémon como las de rutas y expediciones: el paisaje de su tipo difuminado
 * detrás, el Pokémon, el entrenador con su Pokémon y nivel, y sus PS. Primero el jugador, después otros jugadores y al
 * final los bots
 */
export function RaidRoster({ raid, timeScale }: { raid: Raid; timeScale: number }) {
  return (
    <div className="route-list raid-roster">
      {rosterMembers(raid).map((m) => (
        <MemberRow key={m.id} m={m} timeScale={timeScale} />
      ))}
    </div>
  )
}

/** En una sala local el jugador se llama «Tú»: se pone su apodo, si lo tiene (la etiqueta «Tú» ya lo distingue) */
const trainerName = (m: RaidMember): string => (m.kind === RaidMemberKind.Player && m.trainer === PLAYER_TRAINER ? (nickname() ?? m.trainer) : m.trainer)

function MemberRow({ m, timeScale }: { m: RaidMember; timeScale: number }) {
  const sp = species(m.speciesId)
  const down = m.downMs > 0
  return (
    <BackdropRow image={TYPE_SCENERY[sp.types[0]]} className={`raid-row ${m.kind} ${down ? 'down' : ''}`}>
      <Sprite id={m.speciesId} size={56} animated={false} className="raid-row-sprite" />
      <span className="grow small raid-row-info">
        <strong>{trainerName(m)}</strong>
        <span className="raid-row-pill">
          {sp.name} Nv. {m.level}
          {down && ` · vuelve en ${Math.ceil(m.downMs / 1000 / timeScale)} s`}
        </span>
        <Bar value={down ? 0 : m.hpFraction} max={1} kind="hp" />
      </span>
      <MemberTag m={m} />
    </BackdropRow>
  )
}

/** «Tú» en los del jugador (si no se llama ya así) y «Bot» en los bots; los demás jugadores, sin etiqueta */
function MemberTag({ m }: { m: RaidMember }) {
  if (m.kind === RaidMemberKind.Bot) {
    return (
      <span className="raid-tag bot">
        <ItemIcon item={ICON.Bot} size={20} />
        Bot
      </span>
    )
  }
  if (m.kind === RaidMemberKind.Player && trainerName(m) !== PLAYER_TRAINER) return <span className="raid-tag mine">Tú</span>
  return null
}
