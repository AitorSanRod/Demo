import { legSteps, node, route } from '../data/maps'
import { species } from '../data/species'
import { endRun, tapRun } from '../game/run'
import type { GameState, OwnedMon, Run } from '../game/state'
import { maxHp, stepsPerMinute } from '../game/stats'
import { act } from '../game/store'
import { battleFrame, fighterClass } from './battleFrame'
import { Bar } from './common'
import { formatMinutes } from './format'
import { RewardOverlay } from './RewardOverlay'
import { earningsRewards, levelUpReward } from './rewardItems'
import { RouteBattle } from './RouteBattle'
import { WalkScene } from './WalkScene'

/** La ruta avanza sola: el Pokémon camina, se para a combatir en cada parada y sigue hasta el final */
export function RunView({ game, run, mon }: { game: GameState; run: Run; mon: OwnedMon }) {
  const r = route(run.routeId)
  const spm = stepsPerMinute(mon)
  const battle = run.battleMsLeft > 0 && run.lastBattle ? run.lastBattle : null
  const frame = battle && battleFrame(battle, run.battleMsLeft)
  const walking = run.phase === 'walking' && !battle
  const lastStop = run.path.length - 1
  // Durante el combate se ven los PS del momento, no los finales que el motor ya ha calculado
  const hp = frame ? frame.event.playerHp : Math.floor(mon.hp)

  return (
    <div className="screen run">
      <WalkScene
        biome={r.biome}
        speciesId={mon.speciesId}
        moving={walking}
        speed={Math.min(1.8, Math.max(0.6, spm / 22))}
        walkerClass={battle && frame ? `battling ${fighterClass(battle, frame, 'player')}` : ''}
        onStep={walking || battle ? () => act(tapRun) : undefined}
        tapLabel={battle ? '»' : '+1'}
      >
        {battle && frame && <RouteBattle record={battle} frame={frame} />}
      </WalkScene>

      <div className="run-hud">
        <div className="row between">
          <strong>{r.name}</strong>
          <span className="small">
            Parada {run.stop}/{lastStop}
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
            PS {hp}/{maxHp(mon)}
          </span>
        </div>
        <Bar value={hp} max={maxHp(mon)} kind="hp" />
        {/* En el combate de la última parada la ruta sigue 'walking' hasta que acaba, pero ya no hay tramo siguiente */}
        {run.phase === 'walking' && run.stop < lastStop && <LegProgress game={game} run={run} spm={spm} />}
      </div>

      {walking && <div className="tap-hint">Toca para dar un paso · {spm} pasos/min</div>}
      {battle && <div className="tap-hint">¡Combate! Toca para acelerarlo</div>}

      {run.phase !== 'walking' && !battle && <RunSummary run={run} mon={mon} />}
    </div>
  )
}

function LegProgress({ game, run, spm }: { game: GameState; run: Run; spm: number }) {
  const r = route(run.routeId)
  const needed = legSteps(r, run.path, run.stop + 1)
  const remainingMin = (needed - run.steps) / (spm * game.timeScale)
  return (
    <>
      <div className="row between small">
        <span>
          Hacia <strong>{node(r, run.path[run.stop + 1]).name}</strong>
        </span>
        <span>
          {Math.floor(run.steps)}/{needed} · ~{formatMinutes(remainingMin)}
        </span>
      </div>
      <Bar value={run.steps} max={needed} kind="steps" />
    </>
  )
}

/** Al terminar la ruta, sus premios pasan de uno en uno; ya estaban sumados en el estado */
function RunSummary({ run, mon }: { run: Run; mon: OwnedMon }) {
  const r = route(run.routeId)
  const complete = run.phase === 'complete'
  const items = earningsRewards(run.earned)
  if (run.earned.levelsGained > 0) items.push(levelUpReward(mon.speciesId, mon.level))
  if (complete && r.unlocks) {
    items.push({ key: 'unlock', icon: '🗺️', title: 'Nueva ruta', detail: route(r.unlocks).name, color: '#2f9e8f' })
  }
  if (!complete) {
    items.push({ key: 'rest', icon: '💤', title: 'A descansar', detail: 'Se recuperará en el rancho', color: '#6a6a80' })
  }
  return (
    <RewardOverlay
      title={complete ? '¡Ruta completada! 🎉' : 'Tu Pokémon se debilitó…'}
      items={items}
      actionLabel="Volver al Pokérancho"
      onClose={() => act(endRun)}
    />
  )
}
