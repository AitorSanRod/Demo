import type { PassiveRef } from '../../../data/passives'
import { node, route } from '../../../data/maps'
import type { Rng } from '../../core/random'
import { raidBossAt } from '../raid'
import { RAID_BOTS } from '../raidBots'
import { advanceRoom, newRaid, playerMembers, PLAYER_TRAINER, type RoomHooks } from '../raidEngine'
import { BOSS_ID, hasRoom, newMember, outOfLives, presentMembers, RaidMemberKind, type Raid, type RaidMember } from '../raidRoom'
import { RAID_ROUND_MS } from '../raidCombat'
import { ROUTE_RAID_LIVES } from '../routeRaid'
import { advanceStopRoom, stopRoom } from '../stopRoom'
import { ROOM_PLAYED_ROUNDS, skipAhead } from './skipAhead'
import { RoomSlot, type MonSnapshot, type RoomChannel, type RoomView } from './protocol'

// Una sala compartida tal y como la guarda el servidor: la sala del motor de siempre más quién es quién. El servidor
// la pone al día con el tiempo real cada vez que alguien la consulta (catchUp); nadie la juega mientras tanto.

/** Lo más que se pone al día una sala de golpe, como el progreso con la app cerrada (ver core/tick.ts) */
export const ROOM_MAX_CATCHUP_MS = 12 * 60 * 60 * 1000

/** Un Pokémon de un jugador en la sala; la clave del asiento es `playerId/uid` */
export interface Seat {
  playerId: string
  uid: string
  /** Id del participante en `raid.members` */
  memberId: string
  passives: PassiveRef[]
  /** Rondas que ha empezado en pie: el jugador gana la EXP de cada una */
  expRounds: number
}

export interface SharedRoom {
  id: string
  channel: RoomChannel
  raid: Raid
  seats: Record<string, Seat>
  /** Contador para dar ids únicos a los asientos */
  nextSeat: number
  /** Hora real (ms) hasta la que está jugada la sala */
  updatedAt: number
  /** El jefe se escapó: el ciclo pasó al siguiente sin que cayera (ver raidCycle.ts). La sala ya no se juega */
  closed: boolean
}

const seatKey = (playerId: string, uid: string) => `${playerId}/${uid}`

export const seatsOf = (room: SharedRoom, playerId: string): Seat[] => Object.values(room.seats).filter((seat) => seat.playerId === playerId)

const memberOf = (room: SharedRoom, seat: Seat): RaidMember => room.raid.members.find((m) => m.id === seat.memberId)!

/** Jugadores con algún Pokémon dentro ahora */
export const playersIn = (room: SharedRoom): number => playerMembers(room.raid).length

/** Sala nueva del jefe de `channel`; en una parada, `bossHp` (fracción) abre una ya en marcha */
export function createRoom(channel: RoomChannel, id: string, now: number, bossHp: number | null, rng: Rng): SharedRoom {
  const raid =
    channel.slot === RoomSlot.Tab
      ? newRaid(raidBossAt(channel.cycle), null, { felled: channel.cycle })
      : stopRoom(node(route(channel.routeId), channel.nodeId), { routeId: channel.routeId, nodeId: channel.nodeId }, bossHp, rng, () => [])
  return { id, channel, raid, seats: {}, nextSeat: 0, updatedAt: now, closed: false }
}

/** Ganchos del servidor: las pasivas que mandó cada jugador y la cuenta de rondas de EXP de cada asiento */
function serverHooks(room: SharedRoom): RoomHooks {
  const byMember = new Map(Object.values(room.seats).map((seat) => [seat.memberId, seat]))
  return {
    passivesOf: (m) => byMember.get(m.id)?.passives ?? [],
    beforeRound: (raid) => {
      for (const m of playerMembers(raid)) if (m.downMs === 0) byMember.get(m.id)!.expRounds++
    },
  }
}

const advanceShared = (room: SharedRoom, ms: number, rng: Rng, hooks: RoomHooks) =>
  room.channel.slot === RoomSlot.Tab ? advanceRoom(room.raid, ms, RAID_BOTS, rng, hooks) : advanceStopRoom(room.raid, ms, rng, hooks)

/**
 * Juega la sala hasta `now`: lo que pase de ROOM_PLAYED_ROUNDS rondas se resume (skipAhead) y el resto se juega ronda a
 * ronda. Quien gasta sus vidas sale (su jugador lo verá al consultar) y la pelea sigue sin él; al caer el jefe la sala
 * se queda así, para que cada jugador vea la caída y cobre
 */
export function catchUp(room: SharedRoom, now: number, rng: Rng) {
  if (room.closed) return
  const behind = Math.min(Math.max(0, now - room.updatedAt), ROOM_MAX_CATCHUP_MS)
  room.updatedAt = now
  let left: number | null = Math.min(behind, ROOM_PLAYED_ROUNDS * RAID_ROUND_MS)
  skipAhead(room, behind - left)
  const hooks = serverHooks(room)
  while (left !== null && room.raid.hp > 0) {
    left = advanceShared(room, left, rng, hooks)
    for (const m of playerMembers(room.raid)) if (outOfLives(m)) m.left = true
  }
}

/** Hace sitio echando a un bot si la sala está llena; false si no queda ninguno que echar (llena de jugadores) */
function makeRoomFor(raid: Raid): boolean {
  if (hasRoom(raid)) return true
  const bot = presentMembers(raid).find((m) => m.kind === RaidMemberKind.Bot)
  if (bot) bot.left = true
  return !!bot
}

/** Nivel, ★, pasivas y apodo de ahora (pueden cambiar mientras lucha) */
function refreshSeat(room: SharedRoom, seat: Seat, nickname: string, mon: MonSnapshot) {
  seat.passives = mon.passives
  Object.assign(memberOf(room, seat), { trainer: nickname, speciesId: mon.speciesId, level: mon.level, stars: mon.stars })
}

/**
 * Mete al Pokémon en la sala (si ya estuvo, conserva su tiempo y su daño), echando a un bot si no cabe. Sus demás
 * Pokémon salen: cada jugador lleva uno por sala. false si no cabe
 */
export function seatPlayer(room: SharedRoom, playerId: string, nickname: string, mon: MonSnapshot): boolean {
  if (room.raid.hp === 0 || room.closed) return false
  const key = seatKey(playerId, mon.uid)
  for (const other of seatsOf(room, playerId)) if (other.uid !== mon.uid) memberOf(room, other).left = true
  const seat = room.seats[key]
  const member = seat && memberOf(room, seat)
  if (member && !member.left) {
    refreshSeat(room, seat, nickname, mon)
    return true
  }
  if (!makeRoomFor(room.raid)) return false
  const lives = room.channel.slot === RoomSlot.Route ? ROUTE_RAID_LIVES : null
  if (member) Object.assign(member, { left: false, hpFraction: mon.hpFraction, downMs: 0, lives })
  else {
    const memberId = `p${room.nextSeat++}`
    room.seats[key] = { playerId, uid: mon.uid, memberId, passives: [], expRounds: 0 }
    const who = { id: memberId, kind: RaidMemberKind.Player, trainer: nickname, speciesId: mon.speciesId, level: mon.level, stars: mon.stars }
    room.raid.members.push({ ...newMember(who, mon.hpFraction), lives })
  }
  refreshSeat(room, room.seats[key], nickname, mon)
  return true
}

/** Saca de la sala a los Pokémon del jugador; se les recuerda para el reparto */
export function unseatPlayer(room: SharedRoom, playerId: string) {
  for (const seat of seatsOf(room, playerId)) memberOf(room, seat).left = true
}

/** La sala vista por `playerId`: sus Pokémon con su uid y como suyos; los de los demás jugadores, como invitados */
export function viewFor(room: SharedRoom, playerId: string): RoomView {
  const raid = structuredClone(room.raid)
  const mine = new Map(seatsOf(room, playerId).map((seat) => [seat.memberId, seat]))
  const idOf = (id: string) => mine.get(id)?.uid ?? id
  for (const m of raid.members) {
    if (m.kind !== RaidMemberKind.Player) continue
    const seat = mine.get(m.id)
    Object.assign(m, seat ? { id: seat.uid, trainer: PLAYER_TRAINER } : { kind: RaidMemberKind.Guest })
  }
  raid.lastRound = raid.lastRound.map((h) => ({ ...h, from: h.from === BOSS_ID ? h.from : idOf(h.from), to: h.to === BOSS_ID ? h.to : idOf(h.to) }))
  const exp = Object.fromEntries([...mine.values()].map((seat) => [seat.uid, seat.expRounds]))
  return { roomId: room.id, raid, exp, closed: room.closed }
}
