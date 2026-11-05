import type { Rng } from '../../core/random'
import { presentMembers, RaidMemberKind } from '../raidRoom'
import { roomRotation, RoomSlot, type JoinRequest, type RaidRotation, type RotationFeed, type RoomSummary } from './protocol'
import {
  advanceCycle,
  cycleBoss,
  cycleBossIndex,
  cycleChannel,
  cyclePhase,
  featuredRoom,
  isOpenFor,
  isPending,
  nextBossAt,
  nextCycleBossIndex,
  noteFalls,
  type RaidCycle,
} from './raidCycle'
import { escapePush, fallPush, newBossPush, type RaidPush } from './raidPushes'
import { canMakeRoom } from './roomServer'
import { catchUp, createTabRoom, playersIn, seatPlayer, seatsOf, viewFor, type SharedRoom } from './sharedRoom'

// Las salas de la pestaña Raids en el servidor: ponerlas al día junto con su ciclo (raidCycle.ts), la sala principal,
// entrar respetando el ciclo y el resumen de cada sala para la lista.

/**
 * Salas que se ponen al día en una petición, como mucho (el Worker tiene poca CPU por petición): las que pide el
 * jugador y la que lleve más tiempo sin consultas; las demás, cuando alguien las consulte
 */
export const ROOMS_PER_REQUEST = 3

/**
 * El ciclo y sus salas tras ponerse al día; `touched` hay que guardarlas y, con `cycleChanged`, también el ciclo.
 * `pushes`: los avisos de lo que ha pasado (caídas, jefes que se escapan, jefe nuevo), para mandarlos tras guardar
 */
export interface CycleUpdate {
  /** Salas del ciclo actual (si ha pasado al siguiente, las nuevas) */
  rooms: SharedRoom[]
  touched: SharedRoom[]
  cycleChanged: boolean
  pushes: RaidPush[]
}

/** Las salas que hay que poner al día: las pedidas y, de las pendientes, la que lleve más sin consultas */
function roomsToCatchUp(rooms: SharedRoom[], focusIds: (string | null)[]): SharedRoom[] {
  const focus = rooms.filter((r) => focusIds.includes(r.id))
  const stalest = rooms.filter((r) => isPending(r) && !focus.includes(r)).sort((a, b) => a.updatedAt - b.updatedAt)
  return [...focus, ...stalest].slice(0, ROOMS_PER_REQUEST)
}

/**
 * Pone al día el ciclo: las salas pedidas, las caídas (el ciclo se cierra), el paso al siguiente jefe y la sala
 * principal (con el ciclo abierto, siempre hay una). `taken`: los jefes de la otra rotación (ver followingBoss)
 */
export function updateCycle(
  c: RaidCycle,
  rooms: SharedRoom[],
  focusIds: (string | null)[],
  now: number,
  rng: Rng,
  newId: () => string,
  taken: number[] = [],
): CycleUpdate {
  const touched = roomsToCatchUp(rooms, focusIds)
  const standing = touched.filter((r) => r.raid.hp > 0)
  for (const room of touched) catchUp(room, now, rng)
  const pushes = standing.filter((r) => r.raid.hp === 0).flatMap((r) => fallPush(r, now) ?? [])
  let cycleChanged = noteFalls(c, rooms, now)
  let current = rooms
  const escaped = advanceCycle(c, rooms, now, taken, rng)
  if (escaped) {
    touched.push(...escaped.filter((r) => !touched.includes(r)))
    pushes.push(...escaped.flatMap((r) => escapePush(r, now) ?? []), newBossPush(c, now))
    current = []
    cycleChanged = true
  }
  const hasMain = current.some((r) => r.id === c.mainRoomId && !r.closed && r.raid.hp > 0)
  if (c.closingSince === null && !hasMain) {
    const main = createTabRoom(cycleChannel(c), cycleBoss(c), newId(), now)
    c.mainRoomId = main.id
    current = [...current, main]
    touched.push(main)
    cycleChanged = true
  }
  return { rooms: current, touched, cycleChanged, pushes }
}

const ownRoom = (rooms: SharedRoom[], playerId: string) => rooms.find((r) => seatsOf(r, playerId).length > 0)

/**
 * Sala en la que entra el jugador: la que ha elegido; si no, en la que ya estuvo; si no, la del frontal; con el ciclo
 * abierto y todas llenas de jugadores, una nueva. null: no hay jefe al que entrar ahora (se espera al siguiente)
 */
function tabRoomFor(c: RaidCycle, rooms: SharedRoom[], req: JoinRequest, now: number, newId: () => string): SharedRoom | null {
  const open = rooms.filter((r) => isOpenFor(c, r) && canMakeRoom(r))
  const chosen =
    open.find((r) => r.id === req.targetRoomId) ?? ownRoom(open, req.playerId) ?? open.find((r) => r === featuredRoom(c, open, null))
  if (chosen) return chosen
  if (c.closingSince !== null) return null
  const room = createTabRoom(cycleChannel(c), cycleBoss(c), newId(), now)
  rooms.push(room)
  return room
}

/**
 * La rotación en la que entra el jugador: la de la sala que ha elegido o la que pide; si no dice ninguna, la de la sala
 * en la que ya estuvo; si no, la ordenada
 */
export function joinRotation(rotations: { cycle: RaidCycle; rooms: SharedRoom[] }[], req: JoinRequest): RaidRotation {
  if (req.targetRoomId) return roomRotation(req.targetRoomId)
  if (req.channel.slot === RoomSlot.Tab && req.channel.rotation) return req.channel.rotation
  return rotations.find((r) => ownRoom(r.rooms, req.playerId))?.cycle.rotation ?? roomRotation(null)
}

/** Entrar en el jefe de una rotación de la pestaña Raids; devuelve la sala (null si no hay jefe ahora) y el ciclo puesto al día */
export function joinTabRoom(c: RaidCycle, rooms: SharedRoom[], req: JoinRequest, now: number, rng: Rng, newId: () => string, taken: number[] = []) {
  const update = updateCycle(c, rooms, [req.targetRoomId, ownRoom(rooms, req.playerId)?.id ?? null], now, rng, newId, taken)
  const room = tabRoomFor(c, update.rooms, req, now, newId)
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

/** Una rotación de la pestaña Raids vista por `playerId`: el jefe del ciclo, la sala del frontal y las salas en pie */
export function tabFeed(c: RaidCycle, rooms: SharedRoom[], watchRoomId: string | null, playerId: string): RotationFeed {
  const featured = featuredRoom(c, rooms, watchRoomId)
  const standing = rooms.filter((r) => !r.closed && r.raid.hp > 0)
  return {
    rotation: c.rotation,
    bossIndex: cycleBossIndex(c),
    nextBossIndex: nextCycleBossIndex(c),
    phase: cyclePhase(c),
    nextAt: nextBossAt(c),
    featured: featured && viewFor(featured, playerId),
    rooms: standing.map((r) => roomSummary(r, isOpenFor(c, r) && canMakeRoom(r))),
  }
}
