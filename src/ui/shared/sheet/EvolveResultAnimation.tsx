import { RARITY_INFO, rarityOf, species } from '../../../data/species'
import type { EvolveResult } from '../../../game/team/evolution'
import { EvolutionAnimation } from './EvolutionAnimation'

/** Animación de evolución tras `evolve`: de un Pokémon al otro */
export function EvolveResultAnimation({ result, onClose }: { result: EvolveResult; onClose: () => void }) {
  const into = species(result.intoId)
  const detail = `${species(result.fromId).name} ha evolucionado`
  return (
    <EvolutionAnimation
      fromId={result.fromId}
      intoId={result.intoId}
      title="¡Evolución!"
      name={into.name}
      detail={detail}
      color={RARITY_INFO[rarityOf(into)].color}
      onClose={onClose}
    />
  )
}
