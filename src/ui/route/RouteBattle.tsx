import { signatureMove } from '../../data/moves'
import type { BattleRecord, Side } from '../../game/battle/battle'
import { Bar, Sprite } from '../shared/common'
import type { BattleFrame } from './battleFrame'
import { fighterClass } from './battleFrame'
import { HitEffect } from './HitEffect'
import './battle.css'

/**
 * Combate dentro de la escena de la ruta: el rival aparece delante del Pokémon, ambos con su barra de vida,
 * los golpes se ven como números flotantes y con el efecto del tipo del ataque. El sprite del jugador lo pinta
 * `WalkScene`.
 */
export function RouteBattle({ record, frame }: { record: BattleRecord; frame: BattleFrame }) {
  const { event } = frame

  return (
    <div className="route-battle">
      <div className="route-fighter player">
        <FighterBar name={record.player.name} level={record.player.level} hp={event.playerHp} maxHp={record.player.maxHp} />
        <Pop record={record} frame={frame} side="player" />
        <Hit record={record} frame={frame} side="player" />
      </div>
      <div className="route-fighter enemy">
        <FighterBar name={record.enemy.name} level={record.enemy.level} hp={event.enemyHp} maxHp={record.enemy.maxHp} />
        <Pop record={record} frame={frame} side="enemy" />
        <Hit record={record} frame={frame} side="enemy" />
        <div className={`route-enemy ${fighterClass(record, frame, 'enemy')}`}>
          <Sprite id={record.enemy.speciesId} size={112} />
        </div>
      </div>
    </div>
  )
}

/** Efecto del golpe sobre `side` si en este momento lo está recibiendo; el tipo es el del ataque del rival */
function Hit({ record, frame, side }: { record: BattleRecord; frame: BattleFrame; side: Side }) {
  const { event, index } = frame
  if (frame.ended || event.kind !== 'hit' || event.side !== side) return null
  const attacker = side === 'player' ? record.enemy : record.player
  return <HitEffect key={index} type={signatureMove(attacker.speciesId).type} />
}

function FighterBar({ name, level, hp, maxHp }: { name: string; level: number; hp: number; maxHp: number }) {
  return (
    <div className="route-hp">
      <span className="tiny">
        <strong>{name}</strong> Nv. {level}
      </span>
      <Bar value={hp} max={maxHp} kind="hp" />
    </div>
  )
}

/** Número o aviso flotante del evento actual sobre el Pokémon que lo recibe; al ganar, el premio */
function Pop({ record, frame, side }: { record: BattleRecord; frame: BattleFrame; side: Side }) {
  const text = popText(record, frame, side)
  if (!text) return null
  return (
    <span key={frame.ended ? 'end' : frame.index} className={`battle-pop ${frame.ended ? 'reward' : ''}`}>
      {text}
    </span>
  )
}

function popText(record: BattleRecord, frame: BattleFrame, side: Side): string {
  if (frame.ended) {
    if (side !== 'enemy' || record.outcome !== 'win') return ''
    return `+₽ ${record.rewards.money}${record.rewards.tickets > 0 ? ' 🎟' : ''}${record.rewards.piece ? ' 🧩' : ''}`
  }
  const { event, index } = frame
  if (event.side !== side) return ''
  if (event.kind === 'miss') return event.text.startsWith('No afecta') ? 'No afecta' : '¡Fallo!'
  if (event.kind !== 'hit') return ''
  const before = record.events[index - 1]
  const lost = side === 'player' ? before.playerHp - event.playerHp : before.enemyHp - event.enemyHp
  return event.text ? `-${lost} ${event.text}` : `-${lost}`
}
