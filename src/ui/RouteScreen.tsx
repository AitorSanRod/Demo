import { useState } from 'react'
import { KANTO, node, route, type Route } from '../data/maps'
import { species } from '../data/species'
import { addSteps, depart, dismissBattle, endRun, runBlocker, startRun } from '../game/engine'
import { activeMon, type GameState, type OwnedMon, type Run } from '../game/state'
import { maxHp, stepsPerMinute } from '../game/stats'
import { act } from '../game/store'
import { BattleView } from './BattleView'
import { Bar, MoveChip, Sprite } from './common'
import { WalkScene } from './WalkScene'

export function RouteScreen({ game, onFainted }: { game: GameState; onFainted: () => void }) {
  const mon = activeMon(game)
  if (!game.run || !mon) return <RouteSelect game={game} />
  return <RunView game={game} run={game.run} mon={mon} onFainted={onFainted} />
}

// ---------------------------------------------------------------- Selección de ruta

function RouteSelect({ game }: { game: GameState }) {
  const blocker = runBlocker(game)
  return (
    <div className="screen scroll">
      <h2 className="section-title">Mapa de {KANTO.name}</h2>
      {blocker && <p className="notice">{blocker}</p>}
      <div className="route-list">
        {KANTO.routes.map((r) => {
          const unlocked = game.unlockedRoutes.includes(r.id)
          const done = game.completedRoutes.includes(r.id)
          return (
            <div key={r.id} className={`card route-card ${unlocked ? '' : 'locked'}`}>
              <div className="route-card-head">
                <strong>{r.name}</strong>
                <span className="muted">Nv. {r.levels[0]}–{r.levels[1]}</span>
                {done && <span className="tag ok">Completada</span>}
              </div>
              <p className="muted small">{unlocked ? r.description : 'Completa la ruta anterior para desbloquearla.'}</p>
              {unlocked && (
                <>
                  <div className="pool">
                    {[...new Set(r.encounters.map((e) => e.speciesId))].map((id) => (
                      <Sprite key={id} id={id} size={44} animated={false} silhouette={!game.seen.includes(id)} />
                    ))}
                  </div>
                  <div className="row between">
                    <span className="small muted">
                      Premio: 🎟 {r.reward.tickets} · ₽ {r.reward.money}
                    </span>
                    <button className="btn primary" disabled={!!blocker} onClick={() => act((s) => startRun(s, r.id))}>
                      Explorar
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
      <p className="tiny muted">Si te derrotan en una ruta, pierdes la mitad del dinero ganado en ella.</p>
    </div>
  )
}

// ---------------------------------------------------------------- Run en curso

function RunView({ game, run, mon, onFainted }: { game: GameState; run: Run; mon: OwnedMon; onFainted: () => void }) {
  const r = route(run.routeId)
  const spm = stepsPerMinute(mon)
  const walking = run.phase === 'walking'
  const remainingMin = (run.stepsNeeded - run.steps) / (spm * game.timeScale)
  const maxRow = Math.max(...r.nodes.map((n) => n.row))
  const stop = node(r, run.targetId ?? run.nodeId).row

  const closeBattle = () => {
    if (act(dismissBattle) === 'fainted') onFainted()
  }

  return (
    <div className="screen run">
      <WalkScene
        biome={r.biome}
        speciesId={mon.speciesId}
        moving={walking}
        speed={Math.min(1.8, Math.max(0.6, spm / 22))}
        onStep={walking ? () => act((s) => addSteps(s, 1)) : undefined}
      />

      <div className="run-hud">
        <div className="row between">
          <strong>{r.name}</strong>
          <span className="small">
            Parada {stop}/{maxRow}
          </span>
          {walking && (
            <button className="hud-close" onClick={() => act(endRun)} aria-label="Abandonar ruta">
              ✕
            </button>
          )}
        </div>
        <div className="row between small">
          <span>
            {species(mon.speciesId).name} Nv. {mon.level}
          </span>
          <span>
            PS {Math.floor(mon.hp)}/{maxHp(mon)}
          </span>
        </div>
        <Bar value={mon.hp} max={maxHp(mon)} kind="hp" />
        {walking && (
          <>
            <div className="row between small">
              <span>
                Hacia <strong>{node(r, run.targetId!).name}</strong>
              </span>
              <span>
                {Math.floor(run.steps)}/{run.stepsNeeded} · ~{formatMinutes(remainingMin)}
              </span>
            </div>
            <Bar value={run.steps} max={run.stepsNeeded} kind="steps" />
          </>
        )}
      </div>

      {walking && <div className="tap-hint">Toca para dar un paso · {spm} pasos/min</div>}

      {run.phase === 'choose' && (
        <div className="sheet">
          <ChoosePanel key={run.nodeId} game={game} run={run} route={r} mon={mon} />
        </div>
      )}

      {run.phase === 'complete' && (
        <div className="sheet complete">
          <h3>¡Ruta completada! 🎉</h3>
          <p className="small">
            {run.earned.wins} victorias · {run.earned.exp} EXP · ₽ {run.earned.money} · 🎟 {run.earned.tickets}
          </p>
          {r.unlocks && <p className="small">Nueva ruta desbloqueada: {route(r.unlocks).name}</p>}
          <button className="btn primary wide" onClick={() => act(endRun)}>
            Volver al Pokérancho
          </button>
        </div>
      )}

      {run.phase === 'battle' && run.battle && <BattleView record={run.battle} onDone={closeBattle} />}
    </div>
  )
}

function formatMinutes(min: number): string {
  if (min < 1) return `${Math.max(1, Math.round(min * 60))} s`
  if (min < 60) return `${Math.round(min)} min`
  return `${Math.floor(min / 60)} h ${Math.round(min % 60)} min`
}

// ---------------------------------------------------------------- Elección en nodo

function ChoosePanel({ game, run, route: r, mon }: { game: GameState; run: Run; route: Route; mon: OwnedMon }) {
  const here = node(r, run.nodeId)
  const [target, setTarget] = useState(here.next[0].to)
  const [moveId, setMoveId] = useState(mon.moves.includes(run.moveId) ? run.moveId : mon.moves[0])

  return (
    <div className="choose">
      <div className="row between">
        <strong>{here.name}</strong>
        <span className="small muted">
          🏆 {run.earned.wins} · ₽ {run.earned.money} · 🎟 {run.earned.tickets}
        </span>
      </div>
      <div className="label">{here.next.length > 1 ? 'Elige camino' : 'Siguiente parada'}</div>
      <div className="branch-list">
        {here.next.map((e) => {
          const n = node(r, e.to)
          const pool = [...new Set((n.encounters ?? r.encounters).map((x) => x.speciesId))]
          return (
            <button key={e.to} className={`branch ${target === e.to ? 'selected' : ''}`} onClick={() => setTarget(e.to)}>
              <strong>
                {n.name}
                {n.next.length === 0 && ' ⭐'}
              </strong>
              <span className="small muted">
                {e.steps} pasos{n.levelBonus ? ` · Nv. +${n.levelBonus}` : ''}
              </span>
              <span className="pool mini">
                {pool.slice(0, 5).map((id) => (
                  <Sprite key={id} id={id} size={28} animated={false} silhouette={!game.seen.includes(id)} />
                ))}
              </span>
            </button>
          )
        })}
      </div>
      <div className="label">Movimiento para el próximo combate</div>
      <p className="tiny muted">Los de estado solo se usan el 1er turno; luego ataca con el primero de daño.</p>
      <div className="move-grid">
        {mon.moves.map((id) => (
          <MoveChip key={id} id={id} selected={moveId === id} onClick={() => setMoveId(id)} />
        ))}
      </div>
      <div className="row between">
        <button className="btn ghost small" onClick={() => act(endRun)}>
          Volver al rancho
        </button>
        <button className="btn primary" onClick={() => act((s) => depart(s, target, moveId))}>
          ¡En marcha! →
        </button>
      </div>
    </div>
  )
}
