import type { ReactNode } from 'react'
import { node, route } from '../../data/maps'
import { species } from '../../data/species'
import type { GameState } from '../../game/core/state'
import type { RoomSummary } from '../../game/raid/online/protocol'
import { watchRoom, type FeedState } from '../../net/raidFeed'
import { Bar, Sprite } from '../shared/common'
import { MonSection } from '../shared/sheet/MonSheet'

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** Parada de ruta de la sala, para leerla: «Ruta 1 · Claro del bosque» */
const stopLabel = (r: RoomSummary) => (r.place ? `${route(r.place.routeId).name} · ${node(route(r.place.routeId), r.place.nodeId).name}` : null)

/**
 * Pestaña «Salas» de Raids: las del jefe actual (se pueden ver en el frontal y entrar desde allí) y, solo para mirar,
 * las de las paradas de ruta con jugadores dentro
 */
export function RaidRooms({ game, state, onWatch }: { game: GameState; state: FeedState; onWatch: () => void }) {
  const feed = state.feed
  if (!feed) return <p className="notice">{state.failing ? 'Sin conexión con el servidor de raids: reintentando…' : 'Buscando salas…'}</p>
  const shownId = game.raid?.remote?.roomId ?? feed.featured?.roomId
  const look = (roomId: string) => {
    watchRoom(roomId)
    onWatch()
  }

  return (
    <div className="mon-card">
      <MonSection title="Jefe de raid">
        {feed.rooms.length === 0 ? (
          <p className="small muted">No queda ninguna sala en pie: el siguiente jefe está al llegar.</p>
        ) : (
          <div className="raid-room-list">
            {feed.rooms.map((r) => (
              <RoomRow key={r.roomId} room={r} current={r.roomId === shownId}>
                <button className="btn small" onClick={() => look(r.roomId)}>
                  {r.open ? 'Ver' : 'Llena'}
                </button>
              </RoomRow>
            ))}
          </div>
        )}
      </MonSection>
      <MonSection title="Jefes de ruta">
        {feed.routeRooms.length === 0 ? (
          <p className="small muted">Ahora no hay nadie luchando contra un jefe de ruta.</p>
        ) : (
          <div className="raid-room-list">
            {feed.routeRooms.map((r) => (
              <RoomRow key={r.roomId} room={r} current={false} />
            ))}
          </div>
        )}
      </MonSection>
    </div>
  )
}

function RoomRow({ room, current, children }: { room: RoomSummary; current: boolean; children?: ReactNode }) {
  const where = stopLabel(room)
  return (
    <div className={`raid-room ${current ? 'current' : ''}`}>
      <Sprite id={room.bossSpeciesId} size={44} animated={false} />
      <div className="raid-room-info">
        <strong className="small">
          {species(room.bossSpeciesId).name} Nv. {room.bossLevel}
        </strong>
        {where && <span className="tiny muted">{where}</span>}
        <Bar value={room.hpFraction} max={1} kind="hp" />
        <span className="tiny">
          {count(room.players, 'jugador', 'jugadores')} · {count(room.bots, 'bot', 'bots')}
        </span>
      </div>
      {children}
    </div>
  )
}
