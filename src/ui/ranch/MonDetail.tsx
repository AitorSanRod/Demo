import { useState } from 'react'
import { signatureMove } from '../../data/moves'
import { RARITY_INFO, rarityOf, species } from '../../data/species'
import { monPlace, type GameState, type MonPlace, type OwnedMon } from '../../game/core/state'
import { act } from '../../game/core/store'
import { healCost, healInstant, REGEN_PER_MIN, setActive, train, trainCost } from '../../game/team/ranch'
import { calcStats, expToNext, maxHp, stepsPerMinute } from '../../game/team/stats'
import { Bar, MoveChip, Sprite, TypeBadge } from '../shared/common'

const PLACE_LABEL: Record<MonPlace, string> = { ranch: 'En el rancho', run: 'En ruta', expedition: 'De expedición' }

export function MonDetail({ game, mon }: { game: GameState; mon: OwnedMon }) {
  const [message, setMessage] = useState('')
  const sp = species(mon.speciesId)
  const stats = calcStats(mon.speciesId, mon.level, mon.stars)
  const hpMax = maxHp(mon)
  const place = monPlace(game, mon.uid)
  const busy = place !== 'ranch'
  const isActive = mon.uid === game.activeUid
  const rarity = RARITY_INFO[rarityOf(sp)]

  const doTrain = () => {
    const res = act((s) => train(s, mon.uid))
    if (res) setMessage(res.levelsGained > 0 ? `¡${sp.name} subió de nivel!` : `${sp.name} ha entrenado duro.`)
  }

  return (
    <div className="card mon-detail">
      <div className="row gap">
        <Sprite id={mon.speciesId} size={72} className="idle-bounce" />
        <div className="grow">
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
            <span className="tiny muted">{PLACE_LABEL[place]}</span>
          </div>
        </div>
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
        <span>PS {stats.hp}</span>
        <span>Ataque {stats.atk}</span>
        <span>Defensa {stats.def}</span>
        <span>Velocidad {stats.spe}</span>
        <span>{stepsPerMinute(mon)} pasos/min</span>
      </div>

      <div className="label">Ataque</div>
      <MoveChip id={signatureMove(mon.speciesId).id} />

      {message && <p className="highlight small">{message}</p>}

      <div className="action-grid">
        <button className="btn" disabled={busy || mon.hp >= hpMax || game.money < healCost(mon)} onClick={() => act((s) => healInstant(s, mon.uid))}>
          💊 Curar<span className="tiny">₽ {healCost(mon)}</span>
        </button>
        <button className="btn" disabled={busy || game.money < trainCost(mon)} onClick={doTrain}>
          🏋️ Entrenar<span className="tiny">₽ {trainCost(mon)}</span>
        </button>
        <button className="btn" disabled={busy || !!game.run || isActive} onClick={() => act((s) => setActive(s, mon.uid))}>
          ⭐ {isActive ? 'Activo' : 'Elegir'}<span className="tiny">Compañero de viaje</span>
        </button>
      </div>

    </div>
  )
}
