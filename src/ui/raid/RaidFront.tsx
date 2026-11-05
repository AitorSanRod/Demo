import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { joinServerRaid, raidBossAt } from '../../game/raid/raid'
import { newRaid } from '../../game/raid/raidEngine'
import { CyclePhase } from '../../game/raid/online/protocol'
import { presentMembers, RAID_ROOM_SIZE, type Raid } from '../../game/raid/raidRoom'
import { featuredRaid, serverNow, watchRoom, type FeedState } from '../../net/raidFeed'
import { formatClock } from '../shared/format'
import { MonSection } from '../shared/sheet/MonSheet'
import { RaidJoin } from './RaidJoin'
import { RaidRoster } from './RaidRoster'
import { RaidScene } from './RaidScene'
import { RaidWaiting } from './RaidWaiting'

/** Milisegundos reales que faltan, según el servidor, para que pueda aparecer el siguiente jefe */
const msToNext = (state: FeedState) => Math.max(0, (state.feed?.nextAt ?? 0) - serverNow(state))

/** Sin ninguna sala en pie: la espera del siguiente jefe, contada con la hora del servidor (igual para todos) */
function waitingRaid(state: FeedState): Raid {
  const feed = state.feed!
  const next = feed.phase === CyclePhase.Closing ? feed.bossIndex + 1 : feed.bossIndex
  return newRaid(raidBossAt(next), null, { startsInMs: msToNext(state) })
}

/**
 * Con servidor, el frontal de la pestaña Raids: la sala de tu Pokémon si está en una; si no, la que diga el servidor
 * (la que tenga más jugadores o la principal) o la que hayas elegido en «Salas»
 */
export function RaidFront({ game, state }: { game: GameState; state: FeedState }) {
  const own = game.raid
  const featured = featuredRaid(state)
  const shown = own ?? featured
  if (!shown) {
    if (!state.feed) return <p className="notice">{state.failing ? 'Sin conexión con el servidor de raids: reintentando…' : 'Buscando al jefe…'}</p>
    return <RaidWaiting game={game} raid={waitingRaid(state)} />
  }
  const roomId = state.feed?.featured?.roomId
  const joinShown = !own && featured && roomId ? (uid: string) => act((s) => joinServerRaid(s, uid, featured, roomId)) : undefined

  return (
    <>
      <RaidScene game={game} raid={shown} />
      <div className="mon-card">
        {state.feed?.phase === CyclePhase.Closing && (
          <p className="small raid-closing">
            Este jefe ya ha caído en una sala. El siguiente aparece en {formatClock(msToNext(state))}, en cuanto acaben las
            salas que siguen peleando.
          </p>
        )}
        {!own && state.watchRoomId && (
          <button className="account-link" onClick={() => watchRoom(null)}>
            Volver a la sala del frontal
          </button>
        )}
        <MonSection title={`En la sala · ${presentMembers(shown).length}/${RAID_ROOM_SIZE}`}>
          <RaidRoster raid={shown} timeScale={game.timeScale} />
        </MonSection>
        <MonSection title="Tu Pokémon">
          <RaidJoin game={game} raid={shown} onJoin={joinShown} />
        </MonSection>
      </div>
    </>
  )
}
