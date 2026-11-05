import { RANCH_TYPE_IDS, type RanchTypeId } from '../../data/ranchTypes'
import { STONE_IDS, type Stone } from '../../data/stones'
import type { GameState } from '../core/state'
import { ranchTypeAvailable } from './ranchTypes'
import { stonesOf } from './stones'

export interface BagEntry<Id> {
  id: Id
  count: number
}

/** Lo comprado en la Tienda y aún sin usar: piedras sin gastar y tipos de rancho sin colocar */
export interface Bag {
  stones: BagEntry<Stone>[]
  ranchTypes: BagEntry<RanchTypeId>[]
}

const held = <Id>(ids: readonly Id[], countOf: (id: Id) => number): BagEntry<Id>[] =>
  ids.map((id) => ({ id, count: countOf(id) })).filter((entry) => entry.count > 0)

export function bagContents(s: GameState): Bag {
  return {
    stones: held(STONE_IDS, (id) => stonesOf(s, id)),
    ranchTypes: held(RANCH_TYPE_IDS, (id) => ranchTypeAvailable(s, id)),
  }
}

export const isBagEmpty = (bag: Bag): boolean => bag.stones.length === 0 && bag.ranchTypes.length === 0
