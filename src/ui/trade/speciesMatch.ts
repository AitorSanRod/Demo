import { SPECIES } from '../../data/species'

const plain = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** Especies cuyo nombre contiene el texto (sin mayúsculas ni tildes); vacío si no se ha escrito nada */
export function matchingSpecies(text: string): number[] {
  const query = plain(text.trim())
  return query ? SPECIES.filter((sp) => plain(sp.name).includes(query)).map((sp) => sp.id) : []
}
