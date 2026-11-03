import { useState } from 'react'
import { evolutionsOf } from '../../../data/evolutions'
import { species } from '../../../data/species'
import type { GameState, OwnedMon } from '../../../game/core/state'
import { act } from '../../../game/core/store'
import { EVOLUTION_STARS, EVOLVE_PRICE, evolve, evolveBlocker, type EvolveResult } from '../../../game/team/evolution'
import { NEW_MON_LEVEL } from '../../../game/team/mons'
import { ConfirmDialog } from '../ConfirmDialog'
import { ICON } from '../icons'
import { ItemIcon } from '../ItemIcon'
import { MonSection } from './MonSheet'

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
    <MonSection title="Evolución">
      <div className="evolve-options">
        {options.map((id, i) => (
          <button key={id} className="btn big-action" disabled={!!blockers[i]} onClick={() => setPendingId(id)}>
            <ItemIcon item={ICON.Evolve} size={36} off={!!blockers[i]} />
            <span className="grow">Evolucionar a {species(id).name}</span>
            <span className="big-action-price">₽ {EVOLVE_PRICE}</span>
          </button>
        ))}
      </div>
      {blockers[0] && <p className="tiny muted">{mon.stars < EVOLUTION_STARS ? `Con ${EVOLUTION_STARS} ★ podrá evolucionar.` : blockers[0]}</p>}
      {pendingId !== null && (
        <ConfirmDialog title={`¿Evolucionar a ${species(pendingId).name}?`} confirmLabel="Evolucionar" onConfirm={() => confirm(pendingId)} onCancel={() => setPendingId(null)}>
          <p className="small confirm-text">{confirmText(game, name, pendingId)}</p>
        </ConfirmDialog>
      )}
    </MonSection>
  )
}

function confirmText(game: GameState, name: string, intoId: number): string {
  const into = species(intoId).name
  const owned = game.owned.some((m) => m.speciesId === intoId)
  return owned
    ? `${name} dejará el equipo y tu ${into} ganará una ★. Cuesta ₽ ${EVOLVE_PRICE}.`
    : `${name} dejará el equipo y llegará ${into} a Nv. ${NEW_MON_LEVEL} y sin ★. Cuesta ₽ ${EVOLVE_PRICE}.`
}
