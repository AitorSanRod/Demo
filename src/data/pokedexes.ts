import kantoMap from '../assets/regions/kanto.webp'
import type { RouteBackdrop } from './maps'
import { SPECIES } from './species'

type Species = (typeof SPECIES)[number]

/** Pokédex de una región: incluye las especies con número entre `first` y `last` (ambos incluidos) */
export interface RegionalDex {
  id: string
  name: string
  first: number
  last: number
  /** Mapa de la región, difuminado en la cabecera de su desplegable */
  backdrop: RouteBackdrop
}

/** Pokédex regionales, en el orden en que se muestran; para añadir una región, añade aquí su rango de números */
export const REGIONAL_DEXES: RegionalDex[] = [
  { id: 'kanto', name: 'Kanto', first: 1, last: 151, backdrop: { image: kantoMap, focusY: 30 } },
]

export interface DexSection {
  /** null para la Pokédex Nacional */
  dex: RegionalDex | null
  species: Species[]
}

const inDex = (d: RegionalDex, id: number) => id >= d.first && id <= d.last

/** Cada especie en la Pokédex de su región; la que no tiene región va a la Nacional, que siempre va al final */
export function dexSections(): DexSection[] {
  const regional = REGIONAL_DEXES.map((dex) => ({ dex, species: SPECIES.filter((s) => inDex(dex, s.id)) }))
  const national = SPECIES.filter((s) => !REGIONAL_DEXES.some((d) => inDex(d, s.id)))
  return [...regional, { dex: null, species: national }]
}
