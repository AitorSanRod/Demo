import { NodeKind, node, route } from '../../../data/maps'
import type { PassiveRef } from '../../../data/passives'
import { RAID_BOSSES } from '../../../data/raidBosses'
import { species } from '../../../data/species'
import { TYPE_INFO, type PokeType } from '../../../data/types'
import { DEFAULT_NICKNAME, NICKNAME_MAX, RaidAction, RoomSlot, type MonSnapshot, type RaidRequest, type RoomChannel } from './protocol'

// Lo que llega al servidor viene de cualquiera: se comprueba todo y se descarta lo que no encaje.

/** Nivel más alto que puede tener un Pokémon */
const MAX_LEVEL = 100
/** ★ más altas que se aceptan */
const MAX_STARS = 10
/** Pasivas como mucho por Pokémon (una por tipo) */
const MAX_PASSIVES = Object.keys(TYPE_INFO).length

const PLAYER_ID = /^[A-Za-z0-9-]{8,64}$/
const MON_UID = /^[A-Za-z0-9_-]{1,32}$/
const ROOM_ID = /^(tab|route)\/[A-Za-z0-9/_-]{1,150}$/

type Json = Record<string, unknown>

const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)
const isInt = (v: unknown, min: number, max: number): v is number => Number.isInteger(v) && (v as number) >= min && (v as number) <= max
const matches = (v: unknown, re: RegExp): v is string => typeof v === 'string' && re.test(v)

/** Apodo sin espacios de más ni caracteres de control, recortado; vacío, el de por defecto */
export function cleanNickname(v: unknown): string {
  const text = typeof v === 'string' ? v.replace(/[\p{C}]/gu, '').replace(/\s+/g, ' ').trim() : ''
  return [...text].slice(0, NICKNAME_MAX).join('') || DEFAULT_NICKNAME
}

const knownSpecies = (id: number) => {
  try {
    return !!species(id)
  } catch {
    return false
  }
}

function parsePassives(v: unknown): PassiveRef[] | null {
  if (!Array.isArray(v) || v.length > MAX_PASSIVES) return null
  const ok = v.every((p) => isObject(p) && typeof p.type === 'string' && p.type in TYPE_INFO && (p.level === 1 || p.level === 2))
  return ok ? v.map((p) => ({ type: p.type as PokeType, level: p.level })) : null
}

export function parseMon(v: unknown): MonSnapshot | null {
  if (!isObject(v) || !matches(v.uid, MON_UID) || !isInt(v.speciesId, 1, Number.MAX_SAFE_INTEGER) || !knownSpecies(v.speciesId)) return null
  if (!isInt(v.level, 1, MAX_LEVEL) || !isInt(v.stars, 0, MAX_STARS)) return null
  if (typeof v.hpFraction !== 'number' || !(v.hpFraction >= 0 && v.hpFraction <= 1)) return null
  const passives = parsePassives(v.passives)
  return passives && { uid: v.uid, speciesId: v.speciesId, level: v.level, stars: v.stars, hpFraction: v.hpFraction, passives }
}

/** Parada de ruta que existe y tiene jefe comunitario */
function isRaidStop(routeId: string, nodeId: string): boolean {
  try {
    const n = node(route(routeId), nodeId)
    return n.kind === NodeKind.Raid && !!n.boss?.tier
  } catch {
    return false
  }
}

export function parseChannel(v: unknown): RoomChannel | null {
  if (!isObject(v)) return null
  if (v.slot === RoomSlot.Tab) return isInt(v.bossIndex, 0, RAID_BOSSES.length - 1) ? { slot: RoomSlot.Tab, bossIndex: v.bossIndex } : null
  if (v.slot !== RoomSlot.Route || typeof v.routeId !== 'string' || typeof v.nodeId !== 'string') return null
  return isRaidStop(v.routeId, v.nodeId) ? { slot: RoomSlot.Route, routeId: route(v.routeId).id, nodeId: v.nodeId } : null
}

const parseBossHp = (v: unknown): number | null | undefined =>
  v === null ? null : typeof v === 'number' && v > 0 && v <= 1 ? v : undefined

/** La petición si es válida; null si falta o sobra algo */
export function parseRequest(body: unknown): RaidRequest | null {
  if (!isObject(body) || !matches(body.playerId, PLAYER_ID)) return null
  const who = { playerId: body.playerId, nickname: cleanNickname(body.nickname) }
  if (body.action === RaidAction.Join) {
    const channel = parseChannel(body.channel)
    const mon = parseMon(body.mon)
    const bossHp = parseBossHp(body.bossHp)
    return channel && mon && bossHp !== undefined ? { action: RaidAction.Join, ...who, channel, mon, bossHp } : null
  }
  if (body.action !== RaidAction.Sync || !matches(body.roomId, ROOM_ID)) return null
  const mon = body.mon === null ? null : parseMon(body.mon)
  return body.mon !== null && !mon ? null : { action: RaidAction.Sync, ...who, roomId: body.roomId, mon }
}
