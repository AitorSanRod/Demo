import { useState } from 'react'
import { isSeen, knownName } from '../../../game/collection/dex'
import type { GameState } from '../../../game/core/state'
import type { EvolveResult } from '../../../game/team/evolution'
import { trainPlan } from '../../../game/team/ranch'
import { CareSection } from './CareSection'
import { EvolvePanel } from './EvolvePanel'
import { EvolveResultAnimation } from './EvolveResultAnimation'
import { FavoriteButton } from './FavoriteButton'
import { MonHero } from './MonHero'
import { MonOverview } from './MonOverview'
import { MonSheet } from './MonSheet'
import { MovePanel } from './MovePanel'
import { SpeciesHero } from './SpeciesHero'
import { TicketsSection } from './TicketsSection'

/**
 * Ficha de un Pokémon a pantalla completa: la misma desde el rancho y desde la Pokédex. Si lo tienes, todas sus
 * secciones; si no, lo que se sabe de la especie y sus tickets. Al evolucionar se cierra tras la animación.
 */
export function PokemonSheet({ game, speciesId, onClose }: { game: GameState; speciesId: number; onClose: () => void }) {
  // Sesiones de entrenamiento elegidas sin aceptar: se ven en el arco de EXP antes de pagarlas
  const [sessions, setSessions] = useState(0)
  const [evolution, setEvolution] = useState<EvolveResult | null>(null)
  const mon = game.owned.find((m) => m.speciesId === speciesId)
  const plan = mon && sessions > 0 ? trainPlan(mon, sessions) : null

  if (evolution) return <EvolveResultAnimation result={evolution} onClose={onClose} />

  const hero = mon ? (
    <MonHero mon={mon} preview={plan} />
  ) : (
    <SpeciesHero speciesId={speciesId} seen={isSeen(game, speciesId)} />
  )
  return (
    <MonSheet label={knownName(game, speciesId)} hero={hero} heroCorner={<FavoriteButton game={game} speciesId={speciesId} />} onClose={onClose}>
      <MonOverview game={game} speciesId={speciesId} mon={mon} previewLevel={plan && plan.levelsGained > 0 ? plan.level : null} />
      {mon && <CareSection game={game} mon={mon} sessions={sessions} onSessionsChange={setSessions} />}
      <TicketsSection game={game} speciesId={speciesId} />
      {mon && <EvolvePanel game={game} mon={mon} onEvolved={setEvolution} />}
      {mon && <MovePanel game={game} mon={mon} />}
    </MonSheet>
  )
}
