import type { ReactNode } from 'react'
import { STATUS_INFO } from '../../data/passives'
import type { BattleEvent, BattleRecord, MissReason, Side } from '../../game/battle/battle'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { isHeavyHit, type BattleFrame } from './battleFrame'

const MISS_POP: Record<MissReason, string> = { miss: '¡Fallo!', dodge: '¡Esquivado!', immune: 'No afecta' }

/** Número o aviso flotante del evento actual sobre el Pokémon que lo recibe; al ganar, el premio */
export function BattlePop({ record, frame, side }: { record: BattleRecord; frame: BattleFrame; side: Side }) {
  if (frame.ended) {
    if (side !== 'enemy' || record.outcome !== 'win') return null
    return (
      <span key="end" className="battle-pop reward">
        <RewardLine record={record} />
      </span>
    )
  }
  const { event, index } = frame
  if (event.side !== side) return null
  const pop = event.kind === 'hit' ? hitPop(event, lostHp(record, index, side)) : shortPop(event)
  if (!pop) return null
  return (
    <span key={index} className={`battle-pop ${event.kind} ${popTone(event)}`}>
      {pop}
    </span>
  )
}

function RewardLine({ record }: { record: BattleRecord }) {
  const { money, tickets, piece, exp } = record.rewards
  return (
    <>
      <span className="reward-money">
        +₽ {money}
        {tickets > 0 && <ItemIcon item={ICON.Ticket} size={20} />}
        {piece && <ItemIcon item={ICON.Piece} size={20} />}
      </span>
      {exp > 0 && <span className="reward-exp">+{exp} EXP</span>}
    </>
  )
}

/** PS que pierde `side` en el evento `index` */
function lostHp(record: BattleRecord, index: number, side: Side): number {
  const before = record.events[index - 1]
  const now = record.events[index]
  return side === 'player' ? before.playerHp - now.playerHp : before.enemyHp - now.enemyHp
}

/** El daño grande y, debajo, por qué: crítico, eficacia, el estado que lo causa o el golpe a sí mismo */
function hitPop(event: BattleEvent, lost: number): ReactNode {
  const note = event.status ? (event.text || STATUS_INFO[event.status].name) : hitNote(event)
  return (
    <>
      <b>-{lost}</b>
      {note && <small>{note}</small>}
    </>
  )
}

function hitNote(event: BattleEvent): string {
  const eff = event.eff ?? 1
  const effText = eff > 1 ? '¡Muy eficaz!' : eff < 1 ? 'Poco eficaz' : ''
  return [event.crit ? '¡Crítico!' : '', effText].filter(Boolean).join(' ')
}

function shortPop(event: BattleEvent): string {
  if (event.kind === 'miss') return MISS_POP[event.miss ?? 'miss']
  if (event.kind === 'heal') return event.text
  if (event.kind === 'status') return `¡${STATUS_INFO[event.status!].name}!`
  return ''
}

/** Golpes fuertes más grandes; los poco eficaces, más pequeños */
function popTone(event: BattleEvent): string {
  if (isHeavyHit(event)) return 'heavy'
  return event.kind === 'hit' && (event.eff ?? 1) < 1 ? 'weak' : ''
}
