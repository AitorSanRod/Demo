import { RARITY_INFO, rarityOf, species } from '../../../data/species'
import { EvolveKind, type EvolveResult } from '../../../game/team/evolution'
import { EvolutionAnimation } from './EvolutionAnimation'

/** Animación de evolución tras `evolve`: de un Pokémon al otro, diciendo si llega nuevo o gana una ★ */
export function EvolveResultAnimation({ result, onClose }: { result: EvolveResult; onClose: () => void }) {
  const into = species(result.intoId)
  const detail =
    result.kind === EvolveKind.New ? `${species(result.fromId).name} ha evolucionado` : `Tu ${into.name} gana una ★ · ${'★'.repeat(result.stars)}`
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
