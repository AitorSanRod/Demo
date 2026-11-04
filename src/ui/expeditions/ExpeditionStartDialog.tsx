import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { Route } from '../../data/maps'
import { species } from '../../data/species'
import { EXP_LEVEL_GAP } from '../../game/battle/rewards'
import type { GameState, OwnedMon } from '../../game/core/state'
import { act } from '../../game/core/store'
import {
  EXPEDITION_DURATIONS,
  expeditionBattles,
  expeditionBlocker,
  expeditionRewardMult,
  expeditionWinRate,
  sendExpedition,
} from '../../game/team/expedition'
import { Sprite } from '../shared/common'
import { formatMinutes } from '../shared/format'
import { MonPicker } from '../shared/MonPicker'
import { HeroLayout } from '../shared/sheet/HeroLayout'
import { BIOME_SCENERY } from '../shared/sheet/scenery'
import '../shared/overlays.css'
import '../route/route-start.css'

interface Props {
  game: GameState
  route: Route
  /** Pokémon del rancho que se pueden mandar; no está vacío */
  mons: OwnedMon[]
  onClose: () => void
}

/** Antes de mandar de expedición: el paisaje de la ruta con el Pokémon elegido, la duración y lo que se puede esperar */
export function ExpeditionStartDialog({ game, route: r, mons, onClose }: Props) {
  const [uid, setUid] = useState(mons[0].uid)
  const [duration, setDuration] = useState(EXPEDITION_DURATIONS[1])
  const mon = mons.find((m) => m.uid === uid) ?? mons[0]
  const blocker = expeditionBlocker(game, mon.uid)
  const winPct = Math.round(expeditionWinRate(mon, r) * 100)

  const send = () => {
    act((s) => sendExpedition(s, mon.uid, r.id, duration))
    onClose()
  }

  return createPortal(
    <div className="confirm-overlay" onClick={onClose}>
      <div className="card route-start" role="dialog" aria-modal="true" aria-label={`Expedición a ${r.name}`} onClick={(e) => e.stopPropagation()}>
        <HeroLayout compact scenery={BIOME_SCENERY[r.biome]} name={r.name} subtitle={`Nv. ${r.levels[0]}–${r.levels[1]}`}>
          <Sprite key={mon.uid} id={mon.speciesId} size={96} className="mon-hero-sprite idle-bounce" />
        </HeroLayout>
        <div className="route-start-body">
          <div className="label">¿Quién va?</div>
          <MonPicker mons={mons} selectedUid={mon.uid} onSelect={setUid} />
          <div className="label">Duración</div>
          <div className="segmented">
            {EXPEDITION_DURATIONS.map((d) => (
              <button key={d} className={duration === d ? 'active' : ''} onClick={() => setDuration(d)}>
                {formatMinutes(d)}
              </button>
            ))}
          </div>
          <p className="small center">
            <strong>{species(mon.speciesId).name}</strong> (Nv. {mon.level}): ~{expeditionBattles(duration)} combates · {winPct}% de victorias ·
            premios ×{expeditionRewardMult(duration).toLocaleString('es')}
          </p>
          <p className="tiny muted">
            Cada victoria da EXP, ₽ y a veces tickets (sin EXP si los rivales tienen más de {EXP_LEVEL_GAP} niveles menos), sin riesgo. Puede
            descubrir Pokémon nuevos. Se puede cancelar, pero entonces no gana nada.
          </p>
          {blocker && <p className="notice small">{blocker}</p>}
          <div className="row gap confirm-actions">
            <button className="btn grow" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn primary grow" disabled={!!blocker} onClick={send}>
              ¡A explorar!
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
