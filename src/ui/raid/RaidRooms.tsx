import type { ReactNode } from 'react'
import { node, route } from '../../data/maps'
import { species } from '../../data/species'
import type { GameState } from '../../game/core/state'
import type { RaidRotation, RoomSummary, RotationFeed } from '../../game/raid/online/protocol'
import { watchRoom, type FeedState } from '../../net/raidFeed'
import { Bar, Sprite } from '../shared/common'
import { MonSection } from '../shared/sheet/MonSheet'
import { ROTATION_LABEL } from './rotations'

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** Parada de ruta de la sala, para leerla: «Ruta 1 · Claro del bosque» */
const stopLabel = (r: RoomSummary) => (r.place ? `${route(r.place.routeId).name} · ${node(route(r.place.routeId), r.place.nodeId).name}` : null)

/** La sala que se ve en el frontal de la rotación: la de tu Pokémon si es de esta; si no, la que diga el servidor */
const shownRoomId = (board: RotationFeed, ownId: string | null | undefined) =>
  board.rooms.some((r) => r.roomId === ownId) ? ownId : board.featured?.roomId

/**
 * Pestaña «Salas» de Raids: las de los jefes de cada rotación (se pueden ver en el frontal de su pestaña y entrar desde
 * allí) y, solo para mirar, las de las paradas de ruta con jugadores dentro
 */
export function RaidRooms({ game, state, onWatch }: { game: GameState; state: FeedState; onWatch: (rotation: RaidRotation) => void }) {
  const feed = state.feed
  if (!feed) return <p className="notice">{state.failing ? 'Sin conexión con el servidor de raids: reintentando…' : 'Buscando salas…'}</p>
  const look = (roomId: string, rotation: RaidRotation) => {
    watchRoom(roomId)
    onWatch(rotation)
  }

  return (
    <div className="mon-card">
      {feed.rotations.map((board) => (
        <MonSection key={board.rotation} title={`Jefe ${ROTATION_LABEL[board.rotation].toLowerCase()}`}>
          {board.rooms.length === 0 ? (
            <p className="small muted">No queda ninguna sala en pie: el siguiente jefe está al llegar.</p>
          ) : (
            <div className="raid-room-list">
              {board.rooms.map((r) => (
                <RoomRow key={r.roomId} room={r} current={r.roomId === shownRoomId(board, game.raids[board.rotation]?.remote?.roomId)}>
                  <button className="btn small" onClick={() => look(r.roomId, board.rotation)}>
                    {r.open ? 'Ver' : 'Llena'}
                  </button>
                </RoomRow>
              ))}
            </div>
          )}
        </MonSection>
      ))}
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
