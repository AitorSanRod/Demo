import { useState } from 'react'
import { legSteps, node, route } from '../../data/maps'
import { species } from '../../data/species'
import type { GameState, OwnedMon, Run } from '../../game/core/state'
import { act } from '../../game/core/store'
import { playerMembers } from '../../game/raid/raidEngine'
import type { Raid } from '../../game/raid/raidRoom'
import { currentRouteRaid } from '../../game/raid/routeRaid'
import { endRun, tapRun } from '../../game/run/run'
import { maxHp, stepsPerMinute } from '../../game/team/stats'
import { Bar } from '../shared/common'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { formatMinutes } from '../shared/format'
import { earningsRewards, levelUpReward, raidBossReward } from '../shared/rewardItems'
import { RewardOverlay } from '../shared/RewardOverlay'
import { battleFrame, fighterClass } from './battleFrame'
import { RouteBattle } from './RouteBattle'
import { RaidBattle } from '../raid/RaidBattleScene'
import { RaidHudLine, RetreatButton } from './RouteRaidHud'
import { WalkScene } from './WalkScene'
import './run.css'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'

/** PS del Pokémon de la ruta en la sala del jefe comunitario (allí se llevan como fracción de los máximos) */
function raidHp(raid: Raid, mon: OwnedMon): number {
  const member = playerMembers(raid).find((m) => m.id === mon.uid)
  return Math.round(maxHp(mon) * (member?.hpFraction ?? 0))
}

/**
 * La ruta avanza sola: el Pokémon camina, se para a combatir en cada parada y sigue hasta el final. En una parada de
 * jefe comunitario, la pelea se ve en la misma escena (con él dentro del grupo) hasta que cae el jefe
 */
export function RunView({ game, run, mon }: { game: GameState; run: Run; mon: OwnedMon }) {
  const r = route(run.routeId)
  const spm = stepsPerMinute(mon)
  const routeRaid = currentRouteRaid(game)
  const battle = run.battleMsLeft > 0 && run.lastBattle ? run.lastBattle : null
  const frame = battle && battleFrame(battle, run.battleMsLeft)
  const walking = run.phase === 'walking' && !battle
  const lastStop = run.path.length - 1
  // Durante el combate se ven los PS del momento, no los finales que el motor ya ha calculado
  const hp = routeRaid ? raidHp(routeRaid, mon) : frame ? frame.event.playerHp : Math.floor(mon.hp)
  const playerClass = battle && frame ? fighterClass(battle, frame, 'player') : ''
  const defeated = run.phase === 'fainted' || playerClass === 'fainted'
  const ended = run.phase === 'complete' || run.phase === 'fainted'

  return (
    <div className={`screen run ${defeated ? 'defeated' : ''}`}>
      <WalkScene
        biome={r.biome}
        // En la pelea del jefe comunitario el Pokémon va con el grupo, no caminando
        speciesId={routeRaid ? undefined : mon.speciesId}
        moving={walking}
        speed={Math.min(1.8, Math.max(0.6, spm / 22))}
        walkerClass={battle ? `battling ${playerClass}` : ''}
        onStep={walking || battle ? () => act(tapRun) : undefined}
      >
        {battle && frame && <RouteBattle record={battle} frame={frame} />}
        {routeRaid && <RaidBattle raid={routeRaid} timeScale={game.timeScale} />}
      </WalkScene>

      <div className="run-hud">
        <div className="row between">
          <strong>{r.name}</strong>
          <span className="small">
            Parada {run.stop}/{lastStop}
          </span>
          {run.phase === 'walking' && <AbandonButton />}
          {routeRaid && <RetreatButton />}
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
        {routeRaid && <RaidHudLine game={game} raid={routeRaid} />}
      </div>

      {walking && <div className="tap-hint">Toca para avanzar más rápido</div>}
      {battle && <div className="tap-hint">¡Combate! Toca para acelerarlo</div>}
      {routeRaid && <div className="tap-hint">¡Jefe comunitario! Los que acaban la ruta se unen a la pelea</div>}

      {ended && !battle && <RunSummary run={run} mon={mon} />}
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
        <span>~{formatMinutes(remainingMin)}</span>
      </div>
      <Bar value={run.steps} max={needed} kind="steps" />
    </>
  )
}

/** Salir de la ruta a medias pide confirmación: se conserva lo ganado, pero no el premio final */
function AbandonButton() {
  const [confirming, setConfirming] = useState(false)
  return (
    <>
      <button className="btn ghost small hud-abandon" onClick={() => setConfirming(true)}>
        Abandonar
      </button>
      {confirming && (
        <ConfirmDialog
          title="¿Abandonar la ruta?"
          confirmLabel="Abandonar"
          onConfirm={() => act(endRun)}
          onCancel={() => setConfirming(false)}
        >
          <p className="small confirm-text">
            Tu Pokémon volverá al rancho. Conservas lo ganado hasta ahora, pero no recibirás el premio de completarla.
          </p>
        </ConfirmDialog>
      )}
    </>
  )
}

/** Al terminar la ruta, sus premios pasan de uno en uno; ya estaban sumados en el estado */
function RunSummary({ run, mon }: { run: Run; mon: OwnedMon }) {
  const r = route(run.routeId)
  const complete = run.phase === 'complete'
  const items = [...run.earned.raidBosses.map(raidBossReward), ...earningsRewards(run.earned)]
  if (run.earned.levelsGained > 0) items.push(levelUpReward(mon.speciesId, mon.level))
  if (complete && r.unlocks) {
    items.push({ key: 'unlock', icon: <ItemIcon item={ICON.Route} size={96} />, title: 'Nueva ruta', detail: route(r.unlocks).name, color: '#2f9e8f' })
  }
  if (!complete) {
    items.push({ key: 'rest', icon: <ItemIcon item={ICON.Rest} size={96} />, title: 'A descansar', detail: 'Se recuperará en el rancho', color: '#6a6a80' })
  }
  return (
    <RewardOverlay
      title={complete ? '¡Ruta completada!' : 'Tu Pokémon se debilitó…'}
      items={items}
      onClose={() => act(endRun)}
    />
  )
}
