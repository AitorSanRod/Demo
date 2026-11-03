import { species } from '../../../data/species'
import { Sprite } from '../common'
import { HeroLayout } from './HeroLayout'
import { TYPE_SCENERY } from './scenery'
import { PixelQuestion } from '../PixelQuestion'

/** Cabecera de una especie que aún no tienes: su paisaje y su silueta, o la ¿ pixelada si no se ha descubierto */
export function SpeciesHero({ speciesId, seen }: { speciesId: number; seen: boolean }) {
  const sp = species(speciesId)
  if (!seen) {
    return (
      <HeroLayout scenery={null} name="???" subtitle="Sin descubrir">
        <PixelQuestion size={128} />
      </HeroLayout>
    )
  }
  return (
    <HeroLayout scenery={TYPE_SCENERY[sp.types[0]]} name={sp.name} subtitle="Aún no lo tienes">
      <Sprite id={speciesId} size={128} animated={false} silhouette className="mon-hero-sprite" />
    </HeroLayout>
  )
}
