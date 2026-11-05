import { slotsOf } from '../../../game/team/ranches'

/** Círculo de la esquina inferior derecha de la cabecera: cuántos espacios del rancho ocupa la especie */
export function RanchSlotsBadge({ speciesId }: { speciesId: number }) {
  const slots = slotsOf(speciesId)
  const hint = `Ocupa ${slots} ${slots === 1 ? 'espacio' : 'espacios'} en el rancho`
  return (
    <span className="ranch-slots-badge" aria-label={hint} title={hint}>
      {slots}
    </span>
  )
}
