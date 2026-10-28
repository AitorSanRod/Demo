import { useState } from 'react'
import { route } from '../data/maps'
import { knownMoves } from '../data/moves'
import { RARITY_INFO, rarityOf, species } from '../data/species'
import { healCost, healInstant, REGEN_PER_MIN, setActive, setMoves, train, trainCost } from '../game/engine'
import type { GameState, OwnedMon } from '../game/state'
import { calcStats, expToNext, maxHp, stepsPerMinute } from '../game/stats'
import { act, resetGame } from '../game/store'
import { Bar, MoveChip, Sprite, TypeBadge } from './common'

export function RanchScreen({ game }: { game: GameState }) {
  const [selectedUid, setSelectedUid] = useState(game.activeUid)
  const mon = game.owned.find((m) => m.uid === selectedUid) ?? game.owned[0]
  const sorted = [...game.owned].sort((a, b) => a.speciesId - b.speciesId)

  return (
    <div className="screen scroll">
      {game.run && (
        <p className="notice">
          {species(game.owned.find((m) => m.uid === game.activeUid)!.speciesId).name} está explorando{' '}
          {route(game.run.routeId).name}.
        </p>
      )}
      {mon && <MonDetail key={mon.uid} game={game} mon={mon} />}

      <h2 className="section-title">
        Tu equipo <span className="muted small">({game.owned.length})</span>
      </h2>
      <div className="team-grid">
        {sorted.map((m) => (
          <button
            key={m.uid}
            className={`team-cell ${m.uid === mon?.uid ? 'selected' : ''} ${m.uid === game.activeUid ? 'active' : ''}`}
            style={{ ['--rarity' as string]: RARITY_INFO[rarityOf(species(m.speciesId))].color }}
            onClick={() => setSelectedUid(m.uid)}
          >
            <Sprite id={m.speciesId} size={64} animated={false} />
            <span className="tiny">Nv. {m.level}</span>
            <Bar value={m.hp} max={maxHp(m)} kind="hp" />
          </button>
        ))}
      </div>

      <button
        className="btn ghost small danger"
        onClick={() => confirm('¿Borrar la partida y empezar de cero?') && resetGame()}
      >
        Reiniciar partida
      </button>
    </div>
  )
}

function MonDetail({ game, mon }: { game: GameState; mon: OwnedMon }) {
  const [editingMoves, setEditingMoves] = useState(false)
  const [hearts, setHearts] = useState<number[]>([])
  const [message, setMessage] = useState('')
  const sp = species(mon.speciesId)
  const stats = calcStats(mon.speciesId, mon.level, mon.stars)
  const hpMax = maxHp(mon)
  const isActive = mon.uid === game.activeUid
  const busy = !!game.run && isActive
  const rarity = RARITY_INFO[rarityOf(sp)]

  const pet = () => {
    const id = Date.now()
    setHearts((h) => [...h.slice(-5), id])
    setTimeout(() => setHearts((h) => h.filter((x) => x !== id)), 900)
  }

  const doTrain = () => {
    const res = act((s) => train(s, mon.uid))
    if (!res) return
    setMessage(res.levelsGained > 0 ? `¡${sp.name} subió de nivel!` : `${sp.name} ha entrenado duro.`)
  }

  const toggleMove = (id: string) => {
    const next = mon.moves.includes(id) ? mon.moves.filter((x) => x !== id) : [...mon.moves, id]
    act((s) => setMoves(s, mon.uid, next))
  }

  return (
    <div className="card mon-detail">
      <div className="mon-stage" onClick={pet}>
        <Sprite id={mon.speciesId} size={120} className="idle-bounce" />
        {hearts.map((h) => (
          <span key={h} className="heart">
            ❤️
          </span>
        ))}
      </div>
      <div className="row between">
        <h2>
          {sp.name} <span className="small muted">Nv. {mon.level}</span>
        </h2>
        <span className="tag" style={{ background: rarity.color }}>
          {rarity.name}
        </span>
      </div>
      <div className="row gap">
        {sp.types.map((t) => (
          <TypeBadge key={t} type={t} />
        ))}
        {mon.stars > 0 && <span className="stars">{'★'.repeat(mon.stars)}</span>}
        {isActive && <span className="tag ok">Activo</span>}
      </div>

      <div className="small row between">
        <span>
          PS {Math.floor(mon.hp)}/{hpMax}
        </span>
        {!busy && mon.hp < hpMax && <span className="muted">Descansando +{REGEN_PER_MIN * 100}%/min</span>}
      </div>
      <Bar value={mon.hp} max={hpMax} kind="hp" />
      <div className="small row between">
        <span>EXP</span>
        <span className="muted">
          {mon.exp}/{expToNext(mon.level)}
        </span>
      </div>
      <Bar value={mon.exp} max={expToNext(mon.level)} kind="exp" />

      <div className="stat-grid small">
        <span>Ataque {stats.atk}</span>
        <span>Defensa {stats.def}</span>
        <span>At. Esp. {stats.spa}</span>
        <span>Def. Esp. {stats.spd}</span>
        <span>Velocidad {stats.spe}</span>
        <span>{stepsPerMinute(mon)} pasos/min</span>
      </div>

      {message && <p className="highlight small">{message}</p>}

      <div className="action-grid">
        <button className="btn" disabled={busy || mon.hp >= hpMax || game.money < healCost(mon)} onClick={() => act((s) => healInstant(s, mon.uid))}>
          💊 Curar<span className="tiny">₽ {healCost(mon)}</span>
        </button>
        <button className="btn" disabled={busy || game.money < trainCost(mon)} onClick={doTrain}>
          🏋️ Entrenar<span className="tiny">₽ {trainCost(mon)}</span>
        </button>
        <button className="btn" disabled={busy} onClick={() => setEditingMoves((e) => !e)}>
          📜 Movimientos<span className="tiny">{mon.moves.length}/4</span>
        </button>
        <button className="btn" disabled={!!game.run || isActive} onClick={() => act((s) => setActive(s, mon.uid))}>
          ⭐ Activo<span className="tiny">{isActive ? 'Ya lo es' : 'Elegir'}</span>
        </button>
      </div>

      {editingMoves && (
        <div className="move-editor">
          <div className="label">Equipados (máx. 4). Toca para quitar o añadir.</div>
          <div className="move-grid">
            {knownMoves(mon.speciesId, mon.level).map((id) => (
              <MoveChip
                key={id}
                id={id}
                selected={mon.moves.includes(id)}
                disabled={!mon.moves.includes(id) && mon.moves.length >= 4}
                onClick={() => toggleMove(id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
