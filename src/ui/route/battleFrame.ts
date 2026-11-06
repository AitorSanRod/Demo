import type { StatusId } from '../../data/passives'
import type { BattleEvent, BattleRecord, Side } from '../../game/battle/battle'
import { battleMoment } from '../../game/run/battleTimeline'

export interface BattleFrame {
  index: number
  event: BattleEvent
  /** Ya se vieron todos los eventos: queda la caída del rival y el premio */
  ended: boolean
}

/** Qué momento del combate toca mostrar según el tiempo que le queda en el motor */
export function battleFrame(record: BattleRecord, msLeft: number): BattleFrame {
  const { index, ended } = battleMoment(record, msLeft)
  return { index, event: record.events[index], ended }
}

/** Golpe fuerte (crítico o muy eficaz): se ve con más fuerza */
export const isHeavyHit = (e: BattleEvent): boolean => e.kind === 'hit' && (!!e.crit || (e.eff ?? 1) > 1)

/** Clase de la animación de un estado alterado sobre el sprite (status-fx.css), mientras dura */
export const statusClass = (status: StatusId | null): string => (status ? `status-${status}` : '')

/** Clase de animación de cada Pokémon en este momento del combate */
export function fighterClass(record: BattleRecord, frame: BattleFrame, side: Side): string {
  const fainted = record.events.slice(0, frame.index + 1).some((e) => e.kind === 'faint' && e.side === side)
  if (fainted) return 'fainted'
  if (frame.ended && side === 'enemy' && record.outcome === 'flee') return 'fleeing'
  if (frame.event.side !== side) return ''
  if (frame.event.kind === 'attack') return `attacking ${side}`
  if (frame.event.kind === 'heal') return 'healed'
  if (frame.event.kind !== 'hit') return ''
  return isHeavyHit(frame.event) ? 'hit heavy' : 'hit'
}
