import type { Rng } from '../../core/random'
import { findMon, type GameState } from '../../core/state'
import { ranchPassives } from '../../team/ranchPassives'
import { gainExp } from '../../team/stats'
import { fallTabRaid } from '../raid'
import { playerMembers, raidExpPerRound, removePlayer } from '../raidEngine'
import { RaidMemberKind, type Raid } from '../raidRoom'
import { currentRouteRaid, finishRouteRaid, startOver } from '../routeRaid'
import { RaidAction, RoomSlot, type JoinRequest, type MonSnapshot, type JoinChannel, type RoomView, type SyncRequest } from './protocol'

// Las salas de la partida enlazadas a una compartida del servidor. Entrar en una sala la deja esperando sitio
// (`remote.roomId` null) y se sigue jugando en local; net/raidSync.ts pide entrar y, con la respuesta, la sala local
// pasa a ser el reflejo de la del servidor. Desde entonces la juega el servidor y aquí solo se aplica lo que pasa.

/** Petición de una sala, sin quién la hace (lo añade net/raidSync.ts) */
type RoomRequest = Omit<JoinRequest, 'playerId' | 'nickname'> | Omit<SyncRequest, 'playerId' | 'nickname'>

export const ROOM_SLOTS: RoomSlot[] = [RoomSlot.Tab, RoomSlot.Route]

export const roomAt = (s: GameState, slot: RoomSlot): Raid | null => (slot === RoomSlot.Tab ? s.raid : currentRouteRaid(s))

function setRoomAt(s: GameState, slot: RoomSlot, raid: Raid) {
  if (slot === RoomSlot.Tab) s.raid = raid
  else s.run!.raid = raid
}

/** El jefe de la sala: el de su parada o, en la pestaña Raids, el que diga el servidor */
const channelOf = (raid: Raid): JoinChannel =>
  raid.place ? { slot: RoomSlot.Route, routeId: raid.place.routeId, nodeId: raid.place.nodeId } : { slot: RoomSlot.Tab }

/** El Pokémon del jugador que está dentro de la sala, como lo necesita el servidor; null si no hay ninguno */
function monSnapshot(s: GameState, raid: Raid): MonSnapshot | null {
  const member = playerMembers(raid)[0]
  const mon = member && findMon(s, member.id)
  if (!mon) return null
  const passives = mon.ranch !== null ? ranchPassives(s, mon.ranch) : []
  return { uid: mon.uid, speciesId: mon.speciesId, level: mon.level, stars: mon.stars, hpFraction: member.hpFraction, passives }
}

/** Lo que toca pedir por la sala de `slot`: entrar si espera sitio, ponerse al día si está enlazada; null, nada */
export function roomRequest(s: GameState, slot: RoomSlot): RoomRequest | null {
  const raid = roomAt(s, slot)
  if (!raid?.remote) return null
  const mon = monSnapshot(s, raid)
  if (raid.remote.roomId !== null) return { action: RaidAction.Sync, roomId: raid.remote.roomId, mon }
  return mon && { action: RaidAction.Join, channel: channelOf(raid), targetRoomId: raid.remote.target, mon, bossHp: raid.remote.openHp }
}

/** Qué Pokémon del jugador hay dentro: si cambia mientras se espera la respuesta, esta ya no vale */
export const presenceKey = (s: GameState, slot: RoomSlot): string => {
  const raid = roomAt(s, slot)
  return raid ? playerMembers(raid).map((m) => m.id).join() : ''
}

/** Sin servidor: la sala sigue jugándose en local, con lo que hubiera en ella */
export function dropLink(s: GameState, slot: RoomSlot) {
  const raid = roomAt(s, slot)
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
function escape(s: GameState, raid: Raid) {
  for (const m of playerMembers(raid)) removePlayer(s, m)
  s.raid = null
}

/** Lo que ha pasado en el servidor se resuelve como en local: el jefe ha caído o el Pokémon ha gastado sus vidas */
function resolve(s: GameState, slot: RoomSlot, raid: Raid, closed: boolean, rng: Rng) {
  if (closed && slot === RoomSlot.Tab) return escape(s, raid)
  if (raid.hp === 0) return slot === RoomSlot.Tab ? fallTabRaid(s, raid, rng) : finishRouteRaid(s, raid, rng)
  const spent = raid.members.some((m) => m.kind === RaidMemberKind.Player && m.lives === 0)
  if (slot === RoomSlot.Route && spent) startOver(s, raid)
}

/**
 * Aplica la respuesta a la petición hecha por la sala `sentRoomId` (null: la de entrar). Se descarta si la sala ya no
 * es esa. Sin sala en la respuesta (ya no existe, o no hay jefe al que entrar): la de la pestaña Raids se deja (el
 * frontal es del servidor) y la de una parada sigue en local. Devuelve si se ha aplicado
 */
export function applyView(s: GameState, slot: RoomSlot, sentRoomId: string | null, view: RoomView | null, rng: Rng = Math.random): boolean {
  const raid = roomAt(s, slot)
  if (!raid?.remote || raid.remote.roomId !== sentRoomId) return false
  if (!view) {
    if (slot === RoomSlot.Tab) escape(s, raid)
    else raid.remote = null
    return true
  }
  const joining = sentRoomId === null
  if (!joining) grantExp(s, view, raid.remote.exp)
  const next: Raid = { ...view.raid, felled: raid.felled, remote: { roomId: view.roomId, exp: view.exp, openHp: null, target: null } }
  setRoomAt(s, slot, next)
  resolve(s, slot, next, view.closed, rng)
  return true
}

/** El servidor ya sabe que el jugador ha dejado la sala */
export function forgetRoom(s: GameState, roomId: string) {
  s.roomsToLeave = s.roomsToLeave.filter((id) => id !== roomId)
}
