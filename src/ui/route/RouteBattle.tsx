import type { CSSProperties } from 'react'
import { signatureMove } from '../../data/moves'
import { STATUS_INFO } from '../../data/passives'
import { TYPE_INFO, type PokeType } from '../../data/types'
import type { BattleRecord, Side } from '../../game/battle/battle'
import { Sprite } from '../shared/common'
import { BattleHud } from './BattleHud'
import { BattlePop } from './BattlePop'
import { fighterClass, statusClass, type BattleFrame } from './battleFrame'
import { HitEffect } from './HitEffect'
import './battle.css'
import './battle-callouts.css'
import './status-fx.css'

const ENEMY_SPRITE_SIZE = 112
/** El jefe se ve un 30% más grande que un salvaje */
const BOSS_SPRITE_SIZE = Math.round(ENEMY_SPRITE_SIZE * 1.3)
/** Eventos del combate durante los que se ve el aviso del jefe */
const BOSS_WARNING_EVENTS = 2

const typeColor = (type: PokeType) => ({ ['--type-color' as string]: TYPE_INFO[type].color }) as CSSProperties

/**
 * Combate dentro de la escena de la ruta: el rival aparece delante del Pokémon, cada uno con su marcador (BattleHud) a sus pies,
 * el ataque se anuncia con su nombre y los golpes se ven como números flotantes con el efecto de su tipo; el crítico
 * destella y un estado alterado se ve en el sprite mientras dura. El sprite del jugador lo pinta `WalkScene`.
 */
export function RouteBattle({ record, frame }: { record: BattleRecord; frame: BattleFrame }) {
  const { event, index } = frame
  const crit = !frame.ended && event.kind === 'hit' && event.crit
  const struck = (side: Side) => !frame.ended && event.kind === 'hit' && event.side === side

  return (
    <div className="route-battle">
      {crit && <div key={`flash-${index}`} className="battle-flash" />}
      <div className="route-fighter player">
        <MoveCallout record={record} frame={frame} side="player" />
        <BattlePop record={record} frame={frame} side="player" />
        <Hit record={record} frame={frame} side="player" />
      </div>
      {record.boss && index < BOSS_WARNING_EVENTS && <div className="boss-warning">¡Un jefe te corta el paso!</div>}
      <div className={`route-fighter enemy ${record.boss ? 'boss' : ''}`}>
        <MoveCallout record={record} frame={frame} side="enemy" />
        <BattlePop record={record} frame={frame} side="enemy" />
        <Hit record={record} frame={frame} side="enemy" />
        <div className={`route-enemy ${fighterClass(record, frame, 'enemy')}`}>
          <div className="scene-shadow" />
          <div className={statusClass(event.enemyStatus)}>
            <Sprite id={record.enemy.speciesId} size={record.boss ? BOSS_SPRITE_SIZE : ENEMY_SPRITE_SIZE} />
          </div>
        </div>
      </div>
      <div className="battle-hud-slot player">
        <BattleHud fighter={record.player} hp={event.playerHp} status={event.playerStatus} struck={struck('player')} />
      </div>
      <div className={`battle-hud-slot enemy ${record.boss ? 'boss' : ''}`}>
        <BattleHud fighter={record.enemy} hp={event.enemyHp} status={event.enemyStatus} struck={struck('enemy')} boss={record.boss} />
      </div>
    </div>
  )
}

const speciesOf = (record: BattleRecord, side: Side) => (side === 'player' ? record.player : record.enemy).speciesId

/**
 * Nombre del ataque, del color de su tipo, sobre quien lo usa: aparece al lanzarlo y sigue mientras se ve su resultado
 * (la clave es el evento del ataque, para que no se reinicie la animación)
 */
function MoveCallout({ record, frame, side }: { record: BattleRecord; frame: BattleFrame; side: Side }) {
  if (frame.ended) return null
  const { index, event } = frame
  const attackAt = event.kind === 'attack' ? index : record.events[index - 1]?.kind === 'attack' ? index - 1 : -1
  if (attackAt < 0 || record.events[attackAt].side !== side) return null
  const mv = signatureMove(speciesOf(record, side))
  return (
    <span key={attackAt} className="move-callout" style={typeColor(mv.type)}>
      {mv.name}
    </span>
  )
}

/**
 * Efecto sobre `side` si en este momento recibe un golpe o un estado: del tipo del ataque del rival, o del tipo que
 * representa el estado cuando el daño es por él (quemadura, veneno, confusión) o lo acaba de recibir
 */
function Hit({ record, frame, side }: { record: BattleRecord; frame: BattleFrame; side: Side }) {
  const { event, index } = frame
  if (frame.ended || event.side !== side || (event.kind !== 'hit' && event.kind !== 'status')) return null
  const rival = side === 'player' ? 'enemy' : 'player'
  const type = event.status ? STATUS_INFO[event.status].type : signatureMove(speciesOf(record, rival)).type
  return <HitEffect key={index} type={type} />
}
