import { describe, expect, it } from 'vitest'
import { Pokemon } from '../../data/pokemon'
import { species } from '../../data/species'
import { createMon } from './mons'
import { calcStats, expToNext, gainExp, MAX_LEVEL, maxHp } from './stats'


describe('calcStats', () => {
  it('las stats crecen con el nivel', () => {
    expect(calcStats(Pokemon.Bulbasaur, 50).atk).toBeGreaterThan(calcStats(Pokemon.Bulbasaur, 10).atk)
  })

  it('cada estrella da un +4% sobre las stats sin estrellas', () => {
    const base = calcStats(Pokemon.Bulbasaur, 50)
    const starred = calcStats(Pokemon.Bulbasaur, 50, 5)
    const atk = species(Pokemon.Bulbasaur).base.atk
    expect(starred.atk).toBe(Math.floor(((2 * atk * 50) / 100 + 5) * 1.2))
    expect(starred.hp).toBeGreaterThan(base.hp)
  })
})

describe('species', () => {
  it('el ataque es el mayor entre el físico y el especial de PokeAPI', () => {
    // Bulbasaur: atk 49, spa 65
    expect(species(Pokemon.Bulbasaur).base.atk).toBe(65)
  })

  it('la defensa es la media entre la física y la especial de PokeAPI', () => {
    // Bulbasaur: def 49, spd 65
    expect(species(Pokemon.Bulbasaur).base.def).toBe(57)
  })
})

describe('gainExp', () => {
  it('sube de nivel justo al alcanzar la EXP necesaria', () => {
    const mon = createMon(Pokemon.Bulbasaur, 5)
    const result = gainExp(mon, expToNext(5))
    expect(mon.level).toBe(6)
    expect(mon.exp).toBe(0)
    expect(result.levelsGained).toBe(1)
  })

  it('suma a los PS actuales lo que crecen los PS máximos', () => {
    const mon = createMon(Pokemon.Bulbasaur, 5)
    mon.hp = 1
    const oldMax = maxHp(mon)
    gainExp(mon, expToNext(5))
    expect(mon.hp).toBe(1 + maxHp(mon) - oldMax)
  })

  it('no supera el nivel máximo', () => {
    const mon = createMon(Pokemon.Bulbasaur, MAX_LEVEL - 1)
    gainExp(mon, 10 ** 9)
    expect(mon.level).toBe(MAX_LEVEL)
    expect(mon.exp).toBe(0)
  })
})
