import { signatureMove } from '../../data/moves'
import { species, SPECIES } from '../../data/species'
import { effectiveness } from '../../data/types'
import { initialState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { ensureRaid } from './raid'

const hurts = (from: number, to: number) => effectiveness(signatureMove(from).type, species(to).types) > 0

/** Una especie que puede herir al jefe y a la que el jefe puede herir (sin depender de cuál sea hoy el jefe) */
export const sparringSpecies = (bossId: number): number => SPECIES.find((sp) => hurts(sp.id, bossId) && hurts(bossId, sp.id))!.id

/** Partida tras el tutorial, con un inicial que puede herir al primer jefe y el jefe ya aparecido */
export function raidState() {
  const s = initialState()
  s.tutorial = null
  ensureRaid(s)
  chooseStarter(s, sparringSpecies(s.raid!.boss.speciesId))
  const raid = s.raid!
  return { s, raid, mon: s.owned[0] }
}
