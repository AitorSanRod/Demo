export type PokeType =
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy'

export const TYPE_INFO: Record<PokeType, { name: string; color: string }> = {
  normal: { name: 'Normal', color: '#a8a878' },
  fire: { name: 'Fuego', color: '#f08030' },
  water: { name: 'Agua', color: '#6890f0' },
  electric: { name: 'Eléctrico', color: '#f8d030' },
  grass: { name: 'Planta', color: '#78c850' },
  ice: { name: 'Hielo', color: '#98d8d8' },
  fighting: { name: 'Lucha', color: '#c03028' },
  poison: { name: 'Veneno', color: '#a040a0' },
  ground: { name: 'Tierra', color: '#e0c068' },
  flying: { name: 'Volador', color: '#a890f0' },
  psychic: { name: 'Psíquico', color: '#f85888' },
  bug: { name: 'Bicho', color: '#a8b820' },
  rock: { name: 'Roca', color: '#b8a038' },
  ghost: { name: 'Fantasma', color: '#705898' },
  dragon: { name: 'Dragón', color: '#7038f8' },
  dark: { name: 'Siniestro', color: '#705848' },
  steel: { name: 'Acero', color: '#b8b8d0' },
  fairy: { name: 'Hada', color: '#ee99ac' },
}

// Solo se guardan las relaciones distintas de x1 (atacante -> defensor)
const CHART: Partial<Record<PokeType, Partial<Record<PokeType, number>>>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
}

export function effectiveness(attack: PokeType, defender: PokeType[]): number {
  return defender.reduce((mult, t) => mult * (CHART[attack]?.[t] ?? 1), 1)
}
