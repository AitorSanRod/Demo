import { signatureMove } from '../../data/moves'
import { STATUS_INFO } from '../../data/passives'
import type { BattleRecord, Side } from '../../game/battle/battle'
import type { ReactNode } from 'react'
import { Bar, Sprite } from '../shared/common'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import type { BattleFrame } from './battleFrame'
import { fighterClass } from './battleFrame'
import { HitEffect } from './HitEffect'
import './battle.css'

const ENEMY_SPRITE_SIZE = 112
/** El jefe se ve un 30% más grande que un salvaje */
const BOSS_SPRITE_SIZE = Math.round(ENEMY_SPRITE_SIZE * 1.3)
/** Eventos del combate (≈0,7 s cada uno) durante los que se ve el aviso del jefe */
const BOSS_WARNING_EVENTS = 2

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
      {record.boss && frame.index < BOSS_WARNING_EVENTS && <div className="boss-warning">¡Un jefe te corta el paso!</div>}
      <div className={`route-fighter enemy ${record.boss ? 'boss' : ''}`}>
        <FighterBar
          name={record.enemy.name}
          level={record.enemy.level}
          hp={event.enemyHp}
          maxHp={record.enemy.maxHp}
          boss={record.boss}
        />
        <Pop record={record} frame={frame} side="enemy" />
        <Hit record={record} frame={frame} side="enemy" />
        <div className={`route-enemy ${fighterClass(record, frame, 'enemy')}`}>
          <Sprite id={record.enemy.speciesId} size={record.boss ? BOSS_SPRITE_SIZE : ENEMY_SPRITE_SIZE} />
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

function FighterBar({ name, level, hp, maxHp, boss = false }: { name: string; level: number; hp: number; maxHp: number; boss?: boolean }) {
  return (
    <div className="route-hp">
      <span className="tiny">
        {boss && <strong className="boss-label">JEFE </strong>}
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
    <span key={frame.ended ? 'end' : frame.index} className={`battle-pop ${frame.ended ? 'reward' : frame.event.kind}`}>
      {text}
    </span>
  )
}

/** Texto corto de cada fallo, según cómo empieza el del registro del combate */
const MISS_POP: [start: string, pop: string][] = [
  ['No afecta', 'No afecta'],
  ['¡Lo esquivó', '¡Esquivado!'],
]

function popText(record: BattleRecord, frame: BattleFrame, side: Side): ReactNode {
  if (frame.ended) {
    if (side !== 'enemy' || record.outcome !== 'win') return ''
    return (
      <>
        <span className="reward-money">
          +₽ {record.rewards.money}
          {record.rewards.tickets > 0 && <ItemIcon item={ICON.Ticket} size={20} />}
          {record.rewards.piece && <ItemIcon item={ICON.Piece} size={20} />}
        </span>
        {record.rewards.exp > 0 && <span className="reward-exp">+{record.rewards.exp} EXP</span>}
      </>
    )
  }
  const { event, index } = frame
  if (event.side !== side) return ''
  if (event.kind === 'miss') return MISS_POP.find(([start]) => event.text.startsWith(start))?.[1] ?? '¡Fallo!'
  if (event.kind === 'heal') return event.text
  if (event.kind === 'status') return `¡${STATUS_INFO[event.status!].name}!`
  if (event.kind !== 'hit') return ''
  const before = record.events[index - 1]
  const lost = side === 'player' ? before.playerHp - event.playerHp : before.enemyHp - event.enemyHp
  return event.text ? `-${lost} ${event.text}` : `-${lost}`
}
