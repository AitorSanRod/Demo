import { RARITY_INFO, rarityOf, species } from '../../../data/species'
import { CombineKind, type CombineResult } from '../../../game/collection/pieces'
import { RevealOverlay } from '../RevealOverlay'
import { EvolutionAnimation } from './EvolutionAnimation'

/** Qué se ve tras combinar tickets: crear el Pokémon es una aparición de luz; una ★ o los ₽, una pantalla corta */
export function CombineResultAnimation({ result, onClose }: { result: CombineResult; onClose: () => void }) {
  const sp = species(result.speciesId)
  const color = RARITY_INFO[rarityOf(sp)].color
  if (result.kind === CombineKind.Unlock) {
    return <EvolutionAnimation intoId={result.speciesId} title="¡Llega al rancho!" name={sp.name} color={color} onClose={onClose} />
  }
  const star = result.kind === CombineKind.Star
  return (
    <RevealOverlay
      title={star ? '¡Mejora!' : 'Tickets cambiados'}
      speciesId={result.speciesId}
      name={sp.name}
      detail={star ? `${'★'.repeat(result.stars ?? 0)} · +4% a todas las stats` : `+₽ ${result.money}`}
      color={color}
      onClose={onClose}
    />
  )
}
