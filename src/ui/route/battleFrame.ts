import type { BattleEvent, BattleRecord, Side } from '../../game/battle/battle'
import { BATTLE_EVENT_MS, battleDuration } from '../../game/run/runBattle'

export interface BattleFrame {
  index: number
  event: BattleEvent
  /** Ya se vieron todos los eventos: queda la caída del rival y el premio */
  ended: boolean
}

/** Qué momento del combate toca mostrar según el tiempo que le queda en el motor */
export function battleFrame(record: BattleRecord, msLeft: number): BattleFrame {
  const elapsed = battleDuration(record) - msLeft
  const index = Math.min(record.events.length - 1, Math.floor(elapsed / BATTLE_EVENT_MS))
  return { index, event: record.events[index], ended: elapsed >= record.events.length * BATTLE_EVENT_MS }
}

/** Clase de animación de cada Pokémon en este momento del combate */
export function fighterClass(record: BattleRecord, frame: BattleFrame, side: Side): string {
  const fainted = record.events.slice(0, frame.index + 1).some((e) => e.kind === 'faint' && e.side === side)
  if (fainted) return 'fainted'
  if (frame.ended && side === 'enemy' && record.outcome === 'flee') return 'fleeing'
  if (frame.event.side !== side) return ''
  if (frame.event.kind === 'attack') return `attacking ${side}`
  return frame.event.kind === 'hit' ? 'hit' : ''
}
