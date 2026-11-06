import { findMon, type GameState } from '../../core/state'
import { ranchPassives } from '../../team/ranchPassives'
import { gainExp } from '../../team/stats'
import { playerMembers, raidExpPerRound, removePlayer } from '../raidEngine'
import { RaidMemberKind, type Raid } from '../raidRoom'
import { beginEnding, isEnding } from '../raidEnding'
import { currentRouteRaid } from '../routeRaid'
import { RAID_ROTATIONS, RaidAction, RoomSlot, type RaidRotation, type JoinRequest, type MonSnapshot, type JoinChannel, type RoomView, type SyncRequest } from './protocol'

// Las salas de la partida enlazadas a una compartida del servidor. Entrar en una sala la deja esperando sitio
// (`remote.roomId` null) y se sigue jugando en local; net/raidSync.ts pide entrar y, con la respuesta, la sala local
// pasa a ser el reflejo de la del servidor. Desde entonces la juega el servidor y aquí solo se aplica lo que pasa.

/** Petición de una sala, sin quién la hace (lo añade net/raidSync.ts) */
type RoomRequest = Omit<JoinRequest, 'playerId' | 'nickname'> | Omit<SyncRequest, 'playerId' | 'nickname'>

/** Dónde está la sala en la partida: la de una rotación de la pestaña Raids o la de la parada de la ruta en curso */
export type RoomKey = RaidRotation | typeof RoomSlot.Route

export const ROOM_KEYS: RoomKey[] = [...RAID_ROTATIONS, RoomSlot.Route]

const isTab = (key: RoomKey): key is RaidRotation => key !== RoomSlot.Route

export const roomAt = (s: GameState, key: RoomKey): Raid | null => (isTab(key) ? s.raids[key] : currentRouteRaid(s))

function setRoomAt(s: GameState, key: RoomKey, raid: Raid) {
  if (isTab(key)) s.raids[key] = raid
  else s.run!.raid = raid
}

/** El jefe de la sala: en la pestaña Raids, el que diga el servidor para su rotación; en la ruta, el de su parada */
const channelOf = (raid: Raid, key: RoomKey): JoinChannel =>
  isTab(key) ? { slot: RoomSlot.Tab, rotation: key } : { slot: RoomSlot.Route, routeId: raid.place!.routeId, nodeId: raid.place!.nodeId }

/** El Pokémon del jugador que está dentro de la sala, como lo necesita el servidor; null si no hay ninguno */
function monSnapshot(s: GameState, raid: Raid): MonSnapshot | null {
  const member = playerMembers(raid)[0]
  const mon = member && findMon(s, member.id)
  if (!mon) return null
  const passives = mon.ranch !== null ? ranchPassives(s, mon.ranch) : []
  return { uid: mon.uid, speciesId: mon.speciesId, level: mon.level, stars: mon.stars, hpFraction: member.hpFraction, passives }
}

/** Lo que toca pedir por la sala de `key`: entrar si espera sitio, ponerse al día si está enlazada; null, nada */
export function roomRequest(s: GameState, key: RoomKey): RoomRequest | null {
  const raid = roomAt(s, key)
  if (!raid?.remote || isEnding(raid)) return null
  const mon = monSnapshot(s, raid)
  if (raid.remote.roomId !== null) return { action: RaidAction.Sync, roomId: raid.remote.roomId, mon }
  return mon && { action: RaidAction.Join, channel: channelOf(raid, key), targetRoomId: raid.remote.target, mon, bossHp: raid.remote.openHp }
}

/** Qué Pokémon del jugador hay dentro: si cambia mientras se espera la respuesta, esta ya no vale */
export const presenceKey = (s: GameState, key: RoomKey): string => {
  const raid = roomAt(s, key)
  return raid ? playerMembers(raid).map((m) => m.id).join() : ''
}

/** Sin servidor: la sala sigue jugándose en local, con lo que hubiera en ella */
export function dropLink(s: GameState, key: RoomKey) {
  const raid = roomAt(s, key)
  if (raid) raid.remote = null
}

/** Da a cada Pokémon la EXP de las rondas que el servidor le ha contado desde la última vez */
function grantExp(s: GameState, view: RoomView, given: Record<string, number>) {
  const perRound = raidExpPerRound(view.raid.boss)
  for (const [uid, rounds] of Object.entries(view.exp)) {
    const mon = findMon(s, uid)
    const pending = rounds - (given[uid] ?? 0)
    if (mon && pending > 0) gainExp(mon, pending * perRound)
  }
}

/** El jefe se ha escapado (el ciclo pasó al siguiente sin que cayera): el Pokémon vuelve al rancho, sin premio */
function escape(s: GameState, rotation: RaidRotation, raid: Raid) {
  for (const m of playerMembers(raid)) removePlayer(s, m)
  s.raids[rotation] = null
}

/**
 * Lo que ha pasado en el servidor se resuelve como en local: si el jefe ha caído o el Pokémon ha gastado sus vidas,
 * empieza el final de la pelea (raidEnding.ts) y, al acabar, el avance de la sala aplica el resultado
 */
function resolve(s: GameState, key: RoomKey, raid: Raid, closed: boolean) {
  if (isTab(key) && closed) return escape(s, key, raid)
  const outOfLives = !isTab(key) && raid.members.some((m) => m.kind === RaidMemberKind.Player && m.lives === 0)
  if (raid.hp === 0 || outOfLives) beginEnding(raid)
}

/**
 * Aplica la respuesta a la petición hecha por la sala `sentRoomId` (null: la de entrar). Se descarta si la sala ya no
 * es esa. Sin sala en la respuesta (ya no existe, o no hay jefe al que entrar): la de la pestaña Raids se deja (el
 * frontal es del servidor) y la de una parada sigue en local. Mientras se ve el final de la pelea, ya no se aplica nada.
 * Devuelve si se ha aplicado
 */
export function applyView(s: GameState, key: RoomKey, sentRoomId: string | null, view: RoomView | null): boolean {
  const raid = roomAt(s, key)
  if (!raid?.remote || raid.remote.roomId !== sentRoomId || isEnding(raid)) return false
  if (!view) {
    if (isTab(key)) escape(s, key, raid)
    else raid.remote = null
    return true
  }
  const joining = sentRoomId === null
  if (!joining) grantExp(s, view, raid.remote.exp)
  const next: Raid = { ...view.raid, endingMs: 0, felled: raid.felled, remote: { roomId: view.roomId, exp: view.exp, openHp: null, target: null } }
  setRoomAt(s, key, next)
  resolve(s, key, next, view.closed)
  return true
}

/** El servidor ya sabe que el jugador ha dejado la sala */
export function forgetRoom(s: GameState, roomId: string) {
  s.roomsToLeave = s.roomsToLeave.filter((id) => id !== roomId)
}
