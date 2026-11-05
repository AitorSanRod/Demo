import type { Item } from '../../../data/items'

const SHOTS = import.meta.glob<string>('../../../assets/tutorials/*.webp', { eager: true, import: 'default' })

/** Captura de `assets/tutorials/<name>.webp` (se generan con `scripts/tutorial-shots.mjs`) */
export function shot(name: string): string {
  const url = SHOTS[`../../../assets/tutorials/${name}.webp`]
  if (!url) throw new Error(`Falta la captura de tutorial «${name}»`)
  return url
}

export interface GuideStep {
  /** URL de la captura, con lo que importa resaltado */
  image: string
  title: string
  text: string
}

export interface Guide {
  id: string
  icon: Item
  title: string
  summary: string
  steps: GuideStep[]
}
