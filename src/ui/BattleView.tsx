import { useEffect, useState } from 'react'
import { move } from '../data/moves'
import type { BattleRecord } from '../game/battle'
import { Bar, Sprite } from './common'

const STEP_MS = 850

export function BattleView({ record, onDone }: { record: BattleRecord; onDone: () => void }) {
  const last = record.events.length - 1
  const [i, setI] = useState(0)
  const [fast, setFast] = useState(false)
  const finished = i >= last

  useEffect(() => {
    if (finished) return
    const t = setTimeout(() => setI((x) => x + 1), fast ? STEP_MS / 3 : STEP_MS)
    return () => clearTimeout(t)
  }, [i, fast, finished])

  const ev = record.events[i]
  const text = record.events.slice(0, i + 1).findLast((e) => e.text)?.text ?? ''
  const hitClass = (side: 'player' | 'enemy') =>
    ev.side === side && ev.kind === 'hit' ? 'hit' : ev.side === side && ev.kind === 'faint' ? 'fainted' : ''
  const attacking = (side: 'player' | 'enemy') => (ev.side === side && ev.kind === 'attack' ? 'attacking' : '')
  const { rewards, outcome } = record

  return (
    <div className="battle-overlay">
      <div className="battle-field">
        <div className="battle-info enemy-info">
          <div className="row between">
            <strong>{record.enemy.name}</strong>
            <span className="small">Nv. {record.enemy.level}</span>
          </div>
          <Bar value={ev.enemyHp} max={record.enemy.maxHp} kind="hp" />
        </div>
        <div className={`battle-mon enemy ${hitClass('enemy')} ${attacking('enemy')}`}>
          <Sprite id={record.enemy.speciesId} size={112} />
        </div>
        <div className={`battle-mon player ${hitClass('player')} ${attacking('player')}`}>
          <Sprite id={record.player.speciesId} back size={128} />
        </div>
        <div className="battle-info player-info">
          <div className="row between">
            <strong>{record.player.name}</strong>
            <span className="small">Nv. {record.player.level}</span>
          </div>
          <Bar value={ev.playerHp} max={record.player.maxHp} kind="hp" />
          <div className="small right">
            {ev.playerHp}/{record.player.maxHp}
          </div>
        </div>
      </div>

      <div className="battle-text">
        {!finished ? (
          <>
            <p>{text}</p>
            <div className="row between">
              <span className="small muted">Usando {move(record.moveId).name}</span>
              <span className="row gap">
                <button className="btn ghost small" onClick={() => setFast((f) => !f)}>
                  {fast ? 'x1' : 'x3'}
                </button>
                <button className="btn ghost small" onClick={() => setI(last)}>
                  Saltar
                </button>
              </span>
            </div>
          </>
        ) : (
          <div className="battle-result">
            {outcome === 'win' && (
              <>
                <h3>¡Victoria!</h3>
                <p>
                  +{rewards.exp} EXP · +₽ {rewards.money}
                  {rewards.tickets > 0 && ' · +🎟 1'}
                </p>
                {rewards.levelsGained > 0 && (
                  <p className="highlight">
                    ¡{record.player.name} subió a Nv. {record.player.level + rewards.levelsGained}!
                  </p>
                )}
                {rewards.learned.map((id) => (
                  <p key={id} className="highlight">
                    ¡Aprendió {move(id).name}!
                  </p>
                ))}
              </>
            )}
            {outcome === 'lose' && (
              <>
                <h3>{record.player.name} se debilitó…</h3>
                <p>La ruta ha terminado. Vuelve al Pokérancho a recuperarse.</p>
                {rewards.moneyLost > 0 && (
                  <p className="loss">Pierdes ₽ {rewards.moneyLost} (la mitad de lo ganado en la ruta)</p>
                )}
              </>
            )}
            {outcome === 'flee' && (
              <>
                <h3>El combate se alargó</h3>
                <p>{record.enemy.name} salvaje huyó. Sin recompensa.</p>
              </>
            )}
            <button className="btn primary wide" onClick={onDone}>
              {outcome === 'lose' ? 'Ir al Pokérancho' : 'Continuar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
