import { useState } from 'react'
import { KANTO, route } from '../data/maps'
import { species } from '../data/species'
import {
  collectExpedition,
  EXPEDITION_DURATIONS,
  expeditionBattles,
  expeditionBlocker,
  expeditionWinRate,
  isExpeditionDone,
  sendExpedition,
} from '../game/expedition'
import { findMon, type GameState, type OwnedMon } from '../game/state'
import { act } from '../game/store'
import { Bar, Sprite } from './common'
import { formatMinutes } from './format'
import { RewardOverlay, type RewardItem } from './RewardOverlay'
import { earningsRewards, levelUpReward } from './rewardItems'

// ---------------------------------------------------------------- Enviar

export function ExpeditionForm({ game, mon }: { game: GameState; mon: OwnedMon }) {
  const routes = KANTO.routes.filter((r) => game.unlockedRoutes.includes(r.id))
  const [routeId, setRouteId] = useState(routes[routes.length - 1].id)
  const [duration, setDuration] = useState(EXPEDITION_DURATIONS[1])
  const blocker = expeditionBlocker(game, mon.uid)
  const winPct = Math.round(expeditionWinRate(mon, route(routeId)) * 100)

  return (
    <div className="expedition-form">
      <div className="label">Ruta</div>
      <div className="row gap">
        {routes.map((r) => (
          <button key={r.id} className={`btn small ${routeId === r.id ? 'primary' : ''}`} onClick={() => setRouteId(r.id)}>
            {r.name}
          </button>
        ))}
      </div>
      <div className="label">Duración</div>
      <div className="row gap">
        {EXPEDITION_DURATIONS.map((d) => (
          <button key={d} className={`btn small ${duration === d ? 'primary' : ''}`} onClick={() => setDuration(d)}>
            {formatMinutes(d)}
          </button>
        ))}
      </div>
      <p className="small muted">
        ~{expeditionBattles(duration)} combates · {winPct}% de victorias. Al volver gana {route(routeId).reward.exp} EXP
        (los combates solo dan ₽ y tickets), sin riesgo.
      </p>
      {blocker && <p className="notice small">{blocker}</p>}
      <button
        className="btn primary wide"
        disabled={!!blocker}
        onClick={() => act((s) => sendExpedition(s, mon.uid, routeId, duration))}
      >
        Enviar a {route(routeId).name}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------- En curso

export function ExpeditionList({ game }: { game: GameState }) {
  const [report, setReport] = useState<{ name: string; items: RewardItem[] } | null>(null)

  const collect = (uid: string, name: string) => {
    const collected = act((s) => {
      const result = collectExpedition(s, uid)
      const mon = findMon(s, uid)!
      return result && { result, speciesId: mon.speciesId, level: mon.level }
    })
    if (!collected) return
    const items = earningsRewards(collected.result)
    if (collected.result.levelsGained > 0) items.push(levelUpReward(collected.speciesId, collected.level))
    setReport({ name, items })
  }

  return (
    <div className="card expedition-list">
      {report && <RewardOverlay title={`¡${report.name} ha vuelto!`} items={report.items} onClose={() => setReport(null)} />}
      {game.expeditions.length === 0 && <p className="small muted">Ningún Pokémon está de expedición.</p>}
      {game.expeditions.map((e) => {
        const mon = findMon(game, e.uid)!
        const name = species(mon.speciesId).name
        const done = isExpeditionDone(e)
        const left = (e.durationMin - e.elapsedMin) / game.timeScale
        return (
          <div key={e.uid} className="expedition-row">
            <Sprite id={mon.speciesId} size={40} animated={false} />
            <span className="grow small">
              <strong>
                {name} <span className="muted">Nv. {mon.level}</span>
              </strong>
              <span className="muted">
                {route(e.routeId).name} · {done ? '¡Ha vuelto!' : `quedan ${formatMinutes(left)}`}
              </span>
              {!done && <Bar value={e.elapsedMin} max={e.durationMin} kind="steps" />}
            </span>
            {done && (
              <button className="btn primary small" onClick={() => collect(e.uid, name)}>
                Recoger
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
