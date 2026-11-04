import { useState } from 'react'
import { evolutionsOf, evolutionTo, type Evolution } from '../../../data/evolutions'
import { species } from '../../../data/species'
import { STONES } from '../../../data/stones'
import type { GameState, OwnedMon } from '../../../game/core/state'
import { act } from '../../../game/core/store'
import { evolve, evolveBlocker, evolveDestination, evolvePrice, type EvolveResult } from '../../../game/team/evolution'
import { stonesOf } from '../../../game/team/stones'
import { ConfirmDialog } from '../ConfirmDialog'
import { ICON } from '../icons'
import { ItemIcon } from '../ItemIcon'
import { MonSection } from './MonSheet'

/** Botón de evolucionar (uno por opción: Eevee tiene tres), con su aviso si aún no puede. No se pinta si la especie no evoluciona. */
export function EvolvePanel({ game, mon, onEvolved }: { game: GameState; mon: OwnedMon; onEvolved: (result: EvolveResult) => void }) {
  const [pendingId, setPendingId] = useState<number | null>(null)
  const options = evolutionsOf(mon.speciesId)
  if (options.length === 0) return null

  const confirm = (intoId: number) => {
    setPendingId(null)
    const result = act((s) => evolve(s, mon.uid, intoId))
    if (result) onEvolved(result)
  }

  return (
    <MonSection title="Evolución">
      <div className="evolve-options">
        {options.map((evo) => (
          <EvolveOption key={evo.into} game={game} mon={mon} evo={evo} onPick={() => setPendingId(evo.into)} />
        ))}
      </div>
      {pendingId !== null && (
        <ConfirmDialog title={`¿Evolucionar a ${species(pendingId).name}?`} confirmLabel="Evolucionar" onConfirm={() => confirm(pendingId)} onCancel={() => setPendingId(null)}>
          <p className="small confirm-text">{confirmText(game, mon, pendingId)}</p>
        </ConfirmDialog>
      )}
    </MonSection>
  )
}

function EvolveOption({ game, mon, evo, onPick }: { game: GameState; mon: OwnedMon; evo: Evolution; onPick: () => void }) {
  const blocker = evolveBlocker(game, mon.uid, evo.into)
  const stone = evo.stone && STONES[evo.stone]
  return (
    <div className="evolve-option">
      <button className="btn big-action" disabled={!!blocker} onClick={onPick}>
        <ItemIcon item={stone ? stone.item : ICON.Evolve} size={36} off={!!blocker} />
        <span className="grow">
          Evolucionar a {species(evo.into).name}
          <span className="tiny muted evolve-requirement">
            {stone ? `${stone.name} · tienes ${stonesOf(game, evo.stone!)}` : `A partir de Nv. ${evo.level}`}
          </span>
        </span>
        <span className="big-action-price">₽ {evolvePrice(evo.into)}</span>
      </button>
      {blocker && <p className="tiny muted">{blocker}</p>}
    </div>
  )
}

function confirmText(game: GameState, mon: OwnedMon, intoId: number): string {
  const name = species(mon.speciesId).name
  const stone = evolutionTo(mon.speciesId, intoId)?.stone
  const cost = `₽ ${evolvePrice(intoId)}${stone ? ` y una ${STONES[stone].name}` : ''}`
  const destination = evolveDestination(game, mon, intoId)
  const moves = destination !== undefined && destination !== null && destination !== mon.ranch
  return [
    `${name} evolucionará a ${species(intoId).name}: conserva su nivel y su EXP, pierde sus ★. Cuesta ${cost}.`,
    moves ? `En su rancho no cabe: irá al Rancho ${destination + 1}.` : '',
    `En la Pokédex, ${name} volverá a quedar solo como visto.`,
  ]
    .filter(Boolean)
    .join(' ')
}
