import { isOver, type SharedRoom } from './sharedRoom'

// El daño de una sala compartida para el ranking de daño (worker/db/damageRanking.ts): se apunta una sola vez, al
// terminar la pelea (cae el jefe o se escapa), con el daño de cada Pokémon de cada jugador.

/** Daño que ha hecho al jefe un Pokémon de un jugador */
export interface MonDamage {
  playerId: string
  uid: string
  /** Especie con la que acabó la pelea (puede haber evolucionado) */
  speciesId: number
  damage: number
}

/**
 * Si la pelea ha terminado y su daño aún no está apuntado, lo devuelve y la marca como apuntada; si no, lista vacía.
 * Los Pokémon que salieron antes del final también cuentan; los que no hicieron daño, no
 */
export function takeDamageTally(room: SharedRoom): MonDamage[] {
  if (!room.damagePending || !isOver(room)) return []
  room.damagePending = false
  return Object.values(room.seats).flatMap((seat) => {
    const member = room.raid.members.find((m) => m.id === seat.memberId)
    const damage = Math.round(member?.damage ?? 0)
    return member && damage > 0 ? [{ playerId: seat.playerId, uid: seat.uid, speciesId: member.speciesId, damage }] : []
  })
}
