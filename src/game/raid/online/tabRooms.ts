import type { Rng } from '../../core/random'
import { presentMembers, RaidMemberKind } from '../raidRoom'
import { RoomSlot, type JoinRequest, type RaidFeed, type RoomSummary } from './protocol'
import { advanceCycle, cycleBossIndex, cyclePhase, featuredRoom, isOpenFor, isPending, nextBossAt, noteFalls, type RaidCycle } from './raidCycle'
import { canMakeRoom } from './roomServer'
import { catchUp, createRoom, playersIn, seatPlayer, seatsOf, viewFor, type SharedRoom } from './sharedRoom'

// Las salas de la pestaña Raids en el servidor: ponerlas al día junto con su ciclo (raidCycle.ts), la sala principal,
// entrar respetando el ciclo y el resumen de cada sala para la lista.

/**
 * Salas que se ponen al día en una petición, como mucho (el Worker tiene poca CPU por petición): las que pide el
 * jugador y la que lleve más tiempo sin consultas; las demás, cuando alguien las consulte
 */
export const ROOMS_PER_REQUEST = 3

/** El ciclo y sus salas tras ponerse al día; `touched` hay que guardarlas y, con `cycleChanged`, también el ciclo */
export interface CycleUpdate {
  /** Salas del ciclo actual (si ha pasado al siguiente, las nuevas) */
  rooms: SharedRoom[]
  touched: SharedRoom[]
  cycleChanged: boolean
}

/** Las salas que hay que poner al día: las pedidas y, de las pendientes, la que lleve más sin consultas */
function roomsToCatchUp(rooms: SharedRoom[], focusIds: (string | null)[]): SharedRoom[] {
  const focus = rooms.filter((r) => focusIds.includes(r.id))
  const stalest = rooms.filter((r) => isPending(r) && !focus.includes(r)).sort((a, b) => a.updatedAt - b.updatedAt)
  return [...focus, ...stalest].slice(0, ROOMS_PER_REQUEST)
}

/**
 * Pone al día el ciclo: las salas pedidas, las caídas (el ciclo se cierra), el paso al siguiente jefe y la sala
 * principal (con el ciclo abierto, siempre hay una)
 */
export function updateCycle(c: RaidCycle, rooms: SharedRoom[], focusIds: (string | null)[], now: number, rng: Rng, newId: () => string): CycleUpdate {
  const touched = roomsToCatchUp(rooms, focusIds)
  for (const room of touched) catchUp(room, now, rng)
  let cycleChanged = noteFalls(c, rooms, now)
  let current = rooms
  const escaped = advanceCycle(c, rooms, now)
  if (escaped) {
    touched.push(...escaped.filter((r) => !touched.includes(r)))
    current = []
    cycleChanged = true
  }
  const hasMain = current.some((r) => r.id === c.mainRoomId && !r.closed && r.raid.hp > 0)
  if (c.closingSince === null && !hasMain) {
    const main = createRoom({ slot: RoomSlot.Tab, cycle: c.number }, newId(), now, null, rng)
    c.mainRoomId = main.id
    current = [...current, main]
    touched.push(main)
    cycleChanged = true
  }
  return { rooms: current, touched, cycleChanged }
}

const ownRoom = (rooms: SharedRoom[], playerId: string) => rooms.find((r) => seatsOf(r, playerId).length > 0)

/**
 * Sala en la que entra el jugador: la que ha elegido; si no, en la que ya estuvo; si no, la del frontal; con el ciclo
 * abierto y todas llenas de jugadores, una nueva. null: no hay jefe al que entrar ahora (se espera al siguiente)
 */
function tabRoomFor(c: RaidCycle, rooms: SharedRoom[], req: JoinRequest, now: number, rng: Rng, newId: () => string): SharedRoom | null {
  const open = rooms.filter((r) => isOpenFor(c, r) && canMakeRoom(r))
  const chosen =
    open.find((r) => r.id === req.targetRoomId) ?? ownRoom(open, req.playerId) ?? open.find((r) => r === featuredRoom(c, open, null))
  if (chosen) return chosen
  if (c.closingSince !== null) return null
  const room = createRoom({ slot: RoomSlot.Tab, cycle: c.number }, newId(), now, null, rng)
  rooms.push(room)
  return room
}

/** Entrar en el jefe de la pestaña Raids; devuelve la sala (null si no hay jefe ahora) y el ciclo puesto al día */
export function joinTabRoom(c: RaidCycle, rooms: SharedRoom[], req: JoinRequest, now: number, rng: Rng, newId: () => string) {
  const update = updateCycle(c, rooms, [req.targetRoomId, ownRoom(rooms, req.playerId)?.id ?? null], now, rng, newId)
  const room = tabRoomFor(c, update.rooms, req, now, rng, newId)
  if (room && !seatPlayer(room, req.playerId, req.nickname, req.mon)) return { update, room: null }
  if (room && !update.touched.includes(room)) update.touched.push(room)
  return { update, room }
}

/** Lo que se enseña de una sala en la lista */
export function roomSummary(room: SharedRoom, open: boolean): RoomSummary {
  const { raid } = room
  return {
    roomId: room.id,
    bossSpeciesId: raid.boss.speciesId,
    bossLevel: raid.boss.level,
    hpFraction: raid.maxHp > 0 ? raid.hp / raid.maxHp : 0,
    players: playersIn(room),
    bots: presentMembers(raid).filter((m) => m.kind === RaidMemberKind.Bot).length,
    place: raid.place,
    open,
  }
}

/** La pestaña Raids vista por `playerId`: el jefe del ciclo, la sala del frontal y las salas en pie (las de ruta, aparte) */
export function tabFeed(c: RaidCycle, rooms: SharedRoom[], watchRoomId: string | null, playerId: string, now: number): Omit<RaidFeed, 'routeRooms'> {
  const featured = featuredRoom(c, rooms, watchRoomId)
  const standing = rooms.filter((r) => !r.closed && r.raid.hp > 0)
  return {
    serverNow: now,
    bossIndex: cycleBossIndex(c),
    phase: cyclePhase(c),
    nextAt: nextBossAt(c),
    featured: featured && viewFor(featured, playerId),
    rooms: standing.map((r) => roomSummary(r, isOpenFor(c, r) && canMakeRoom(r))),
  }
}
