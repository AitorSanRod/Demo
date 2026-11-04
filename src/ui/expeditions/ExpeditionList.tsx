import { useState } from 'react'
import { route } from '../../data/maps'
import { species } from '../../data/species'
import { findMon, type GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { cancelExpedition, collectExpedition, isExpeditionDone } from '../../game/team/expedition'
import { Bar, Sprite } from '../shared/common'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { formatMinutes } from '../shared/format'
import { discoveryReward, earningsRewards, levelUpReward } from '../shared/rewardItems'
import { RewardOverlay, type RewardItem } from '../shared/RewardOverlay'
import { RouteRow } from '../route/RouteRow'

/** Pokémon de expedición: lo que les queda (con opción de cancelar) y, a los que han vuelto, el botón para recoger su premio */
export function ExpeditionList({ game }: { game: GameState }) {
  const [report, setReport] = useState<{ name: string; items: RewardItem[] } | null>(null)
  const [cancellingUid, setCancellingUid] = useState<string | null>(null)
  const cancelling = cancellingUid ? findMon(game, cancellingUid) : undefined

  const collect = (uid: string, name: string) => {
    const collected = act((s) => {
      const result = collectExpedition(s, uid)
      const mon = findMon(s, uid)!
      return result && { result, speciesId: mon.speciesId, level: mon.level, seen: [...s.seen] }
    })
    if (!collected) return
    const items = [...collected.result.discovered.map(discoveryReward), ...earningsRewards(collected.result, collected.seen)]
    if (collected.result.levelsGained > 0) items.push(levelUpReward(collected.speciesId, collected.level))
    setReport({ name, items })
  }

  return (
    <div className="route-list">
      {report && <RewardOverlay title={`¡${report.name} ha vuelto!`} items={report.items} onClose={() => setReport(null)} />}
      {game.expeditions.length === 0 && <p className="card small muted">Ningún Pokémon está de expedición.</p>}
      {game.expeditions.map((e) => {
        const mon = findMon(game, e.uid)!
        const name = species(mon.speciesId).name
        const done = isExpeditionDone(e)
        const left = (e.durationMin - e.elapsedMin) / game.timeScale
        return (
          <RouteRow key={e.uid} route={route(e.routeId)}>
            <Sprite id={mon.speciesId} size={56} animated={false} />
            <span className="grow small expedition-info">
              <strong>
                {name} <span className="muted">Nv. {mon.level}</span>
              </strong>
              <span className="muted">
                {route(e.routeId).name} · {done ? '¡Ha vuelto!' : `quedan ${formatMinutes(left)}`}
              </span>
              {!done && <Bar value={e.elapsedMin} max={e.durationMin} kind="steps" />}
            </span>
            {done ? (
              <button className="btn primary small" onClick={() => collect(e.uid, name)}>
                Recoger
              </button>
            ) : (
              <button className="btn small" onClick={() => setCancellingUid(e.uid)}>
                Cancelar
              </button>
            )}
          </RouteRow>
        )
      })}
      {cancelling && (
        <ConfirmDialog
          title="¿Cancelar la expedición?"
          confirmLabel="Cancelar expedición"
          cancelLabel="Que siga"
          onConfirm={() => {
            act((s) => cancelExpedition(s, cancelling.uid))
            setCancellingUid(null)
          }}
          onCancel={() => setCancellingUid(null)}
        >
          <div className="row gap">
            <Sprite id={cancelling.speciesId} size={64} animated={false} />
            <p className="small confirm-text">
              {species(cancelling.speciesId).name} volverá al rancho ahora y <strong>no ganará nada</strong> de esta expedición: ni EXP, ni
              ₽, ni tickets.
            </p>
          </div>
        </ConfirmDialog>
      )}
    </div>
  )
}
