export type PokeType =
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy'

export const TYPE_INFO: Record<PokeType, { name: string; color: string }> = {
  normal: { name: 'Normal', color: '#9fa19f' },
  fire: { name: 'Fuego', color: '#e62829' },
  water: { name: 'Agua', color: '#2980ef' },
  electric: { name: 'Eléctrico', color: '#fac000' },
  grass: { name: 'Planta', color: '#3fa129' },
  ice: { name: 'Hielo', color: '#3dcef3' },
  fighting: { name: 'Lucha', color: '#ff8000' },
  poison: { name: 'Veneno', color: '#9141cb' },
  ground: { name: 'Tierra', color: '#915121' },
  flying: { name: 'Volador', color: '#81b9ef' },
  psychic: { name: 'Psíquico', color: '#ef4179' },
  bug: { name: 'Bicho', color: '#91a119' },
  rock: { name: 'Roca', color: '#afa981' },
  ghost: { name: 'Fantasma', color: '#704170' },
  dragon: { name: 'Dragón', color: '#5060e1' },
  dark: { name: 'Siniestro', color: '#624d4e' },
  steel: { name: 'Acero', color: '#60a1b8' },
  fairy: { name: 'Hada', color: '#ef70ef' },
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
