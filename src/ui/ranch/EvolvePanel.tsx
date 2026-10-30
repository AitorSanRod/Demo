import { useState } from 'react'
import { evolutionsOf } from '../../data/evolutions'
import { species } from '../../data/species'
import type { GameState, OwnedMon } from '../../game/core/state'
import { act } from '../../game/core/store'
import { EVOLUTION_STARS, evolve, evolveBlocker, EVOLVED_LEVEL, type EvolveResult } from '../../game/team/evolution'
import { ConfirmDialog } from '../shared/ConfirmDialog'

/** Botón de evolucionar (uno por opción: Eevee tiene tres). No se pinta si la especie no evoluciona. */
export function EvolvePanel({ game, mon, onEvolved }: { game: GameState; mon: OwnedMon; onEvolved: (result: EvolveResult) => void }) {
  const [pendingId, setPendingId] = useState<number | null>(null)
  const options = evolutionsOf(mon.speciesId)
  if (options.length === 0) return null

  const name = species(mon.speciesId).name
  const blockers = options.map((id) => evolveBlocker(game, mon.uid, id))
  const confirm = (intoId: number) => {
    setPendingId(null)
    const result = act((s) => evolve(s, mon.uid, intoId))
    if (result) onEvolved(result)
  }

  return (
    <>
      <div className="label">Evolución</div>
      <div className="evolve-options">
        {options.map((id, i) => (
          <button key={id} className="btn" disabled={!!blockers[i]} onClick={() => setPendingId(id)}>
            ✨ {species(id).name}
          </button>
        ))}
      </div>
      {blockers[0] && <p className="tiny muted">{mon.stars < EVOLUTION_STARS ? `Con ${EVOLUTION_STARS} ★ podrá evolucionar.` : blockers[0]}</p>}
      {pendingId !== null && (
        <ConfirmDialog title={`¿Evolucionar a ${species(pendingId).name}?`} confirmLabel="Evolucionar" onConfirm={() => confirm(pendingId)} onCancel={() => setPendingId(null)}>
          <p className="small confirm-text">{confirmText(game, name, pendingId)}</p>
        </ConfirmDialog>
      )}
    </>
  )
}

function confirmText(game: GameState, name: string, intoId: number): string {
  const into = species(intoId).name
  const owned = game.owned.some((m) => m.speciesId === intoId)
  return owned
    ? `${name} dejará el equipo y tu ${into} ganará una ★.`
    : `${name} dejará el equipo y llegará ${into} a Nv. ${EVOLVED_LEVEL} y sin ★.`
}
