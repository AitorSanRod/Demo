import { route } from '../../../data/maps'
import { species } from '../../../data/species'
import { PushTopic, type PushJob } from '../../core/push'
import { earnsPrize } from '../raidPrizes'
import { cycleBoss, type RaidCycle } from './raidCycle'
import { RoomSlot } from './protocol'
import type { SharedRoom } from './sharedRoom'

// Avisos push de los jefes comunitarios (tema Raid): los decide el servidor al ver qué ha pasado en las salas.

/** Un aviso y a quién va: los jugadores (id de raids) de una sala o todos */
export interface RaidPush {
  to: { playerIds: string[] } | 'all'
  job: PushJob
}

/** Jugadores de la sala que cuentan para el aviso: los que siguen dentro y, si `withPrize`, los que ya han cobrado */
function playersOf(room: SharedRoom, withPrize: boolean): string[] {
  const ids = Object.values(room.seats).filter((seat) => {
    const m = room.raid.members.find((x) => x.id === seat.memberId)
    return m && (!m.left || (withPrize && earnsPrize(m, room.raid.elapsedMs)))
  })
  return [...new Set(ids.map((seat) => seat.playerId))]
}

const bossName = (room: SharedRoom) => species(room.raid.boss.speciesId).name

/** Ha caído el jefe de la sala: se avisa a los que cobran (en una parada, a los que siguen en la pelea) */
export function fallPush(room: SharedRoom, now: number): RaidPush | null {
  const tab = room.channel.slot === RoomSlot.Tab
  const playerIds = playersOf(room, tab)
  if (playerIds.length === 0) return null
  const name = bossName(room)
  const job: PushJob = tab
    ? { topic: PushTopic.Raid, key: `fall:${room.id}`, dueAt: now, title: '¡Jefe derrotado!', body: `Habéis tumbado a ${name}. Abre la app para recoger tu premio.` }
    : {
        topic: PushTopic.Raid,
        key: `fall:${room.id}`,
        dueAt: now,
        title: `¡${name} ha caído!`,
        body: `Tu Pokémon y su grupo lo han derrotado en ${room.raid.place ? route(room.raid.place.routeId).name : 'la ruta'}.`,
      }
  return { to: { playerIds }, job }
}

/** El jefe se ha escapado de la sala (el ciclo pasó al siguiente sin que cayera) */
export function escapePush(room: SharedRoom, now: number): RaidPush | null {
  const playerIds = playersOf(room, false)
  if (playerIds.length === 0) return null
  return {
    to: { playerIds },
    job: { topic: PushTopic.Raid, key: `escape:${room.id}`, dueAt: now, title: `${bossName(room)} se ha escapado`, body: 'El jefe de Raids cambió antes de que cayera. Tu Pokémon ha vuelto al rancho.' },
  }
}

/** Ha aparecido el jefe de un ciclo nuevo de una rotación: se avisa a todos */
export function newBossPush(cycle: RaidCycle, now: number): RaidPush {
  const name = species(cycleBoss(cycle).speciesId).name
  const key = `boss:${cycle.rotation}:${cycle.number}`
  return { to: 'all', job: { topic: PushTopic.Raid, key, dueAt: now, title: '¡Nuevo jefe en Raids!', body: `${name} acaba de aparecer. ¡A por él!` } }
}
