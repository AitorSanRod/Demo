import type { CSSProperties } from 'react'
import { STATUS_INFO, type StatusId } from '../../data/passives'
import { species } from '../../data/species'
import { TYPE_INFO, type PokeType } from '../../data/types'
import type { BattleRecord } from '../../game/battle/battle'
import { Bar } from '../shared/common'
import './battle-hud.css'

/** Por debajo de esta fracción de PS el marco de la barra se pone rojo */
const LOW_HP = 0.2

const typeColor = (type: PokeType) => ({ ['--type-color' as string]: TYPE_INFO[type].color }) as CSSProperties

interface BattleHudProps {
  fighter: BattleRecord['player']
  hp: number
  status: StatusId | null
  boss?: boolean
  /** Lo acaban de golpear: el marcador da un respingo */
  struck?: boolean
}

/**
 * Marcador de un combatiente, igual para los dos lados: tipos, nombre y nivel; debajo, la barra de PS con su etiqueta
 * y, si lo tiene, el estado alterado (o «DEB» si se ha debilitado). Con pocos PS el marco de la barra se pone rojo.
 */
export function BattleHud({ fighter, hp, status, boss = false, struck = false }: BattleHudProps) {
  const { types } = species(fighter.speciesId)
  const low = hp > 0 && hp / fighter.maxHp <= LOW_HP
  const classes = ['battle-hud', boss && 'boss', low && 'low', hp === 0 && 'down', struck && 'struck'].filter(Boolean)

  return (
    <div className={classes.join(' ')} style={typeColor(types[0])}>
      <div className="hud-title">
        <span className="hud-types">
          {types.map((t) => (
            <i key={t} style={typeColor(t)} title={TYPE_INFO[t].name} />
          ))}
        </span>
        {boss && <span className="hud-boss">JEFE</span>}
        <strong className="hud-name">{fighter.name}</strong>
        <span className="hud-level">
          <small>Nv.</small>
          {fighter.level}
        </span>
      </div>
      <div className="hud-bar">
        <span className="hud-ps">PS</span>
        <Bar value={hp} max={fighter.maxHp} kind="hp" />
      </div>
      {(status || hp === 0) && (
        <div className="hud-foot">
          <StatusBadge status={status} down={hp === 0} />
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status, down }: { status: StatusId | null; down: boolean }) {
  if (down) return <span className="hud-status down">DEB</span>
  if (!status) return null
  const info = STATUS_INFO[status]
  return (
    <span key={status} className="hud-status" style={typeColor(info.type)} title={info.name}>
      {info.short}
    </span>
  )
}
