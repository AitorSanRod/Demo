import { useState } from 'react'
import { route } from '../../data/maps'
import { species } from '../../data/species'
import { findMon, type GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { collectExpedition, isExpeditionDone } from '../../game/team/expedition'
import { Bar, Sprite } from '../shared/common'
import { formatMinutes } from '../shared/format'
import { earningsRewards, levelUpReward } from '../shared/rewardItems'
import { RewardOverlay, type RewardItem } from '../shared/RewardOverlay'

/** Pokémon de expedición: lo que les queda y, a los que han vuelto, el botón para recoger su premio */
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
