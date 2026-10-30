import { describe, expect, it } from 'vitest'
import { POKEMON } from '../../data/pokemon'
import raw from '../../data/pokemon.json'
import { species } from '../../data/species'
import { createMon } from './mons'
import { calcStats, expToNext, gainExp, MAX_LEVEL, MAX_STARS, maxHp, STAR_BONUS } from './stats'


describe('calcStats', () => {
  it('las stats crecen con el nivel', () => {
    expect(calcStats(POKEMON.Bulbasaur, 50).atk).toBeGreaterThan(calcStats(POKEMON.Bulbasaur, 10).atk)
  })

  it('cada estrella suma su bonus a las stats sin estrellas', () => {
    const base = calcStats(POKEMON.Bulbasaur, 50)
    const starred = calcStats(POKEMON.Bulbasaur, 50, MAX_STARS)
    const mult = 1 + MAX_STARS * STAR_BONUS
    // Margen de 1 punto por el redondeo de cada cálculo
    expect(Math.abs(starred.atk - base.atk * mult)).toBeLessThanOrEqual(1 + mult)
    expect(Math.abs(starred.hp - base.hp * mult)).toBeLessThanOrEqual(1 + mult)
  })
})

describe('species', () => {
  it('el ataque es el mayor entre el físico y el especial de PokeAPI', () => {
    for (const { id, base } of raw) expect(species(id).base.atk).toBe(Math.max(base.atk, base.spa))
  })

  it('la defensa es la media entre la física y la especial de PokeAPI', () => {
    for (const { id, base } of raw) expect(species(id).base.def).toBe(Math.round((base.def + base.spd) / 2))
  })
})

describe('gainExp', () => {
  it('sube de nivel justo al alcanzar la EXP necesaria', () => {
    const mon = createMon(POKEMON.Bulbasaur, 5)
    const result = gainExp(mon, expToNext(5))
    expect(mon.level).toBe(6)
    expect(mon.exp).toBe(0)
    expect(result.levelsGained).toBe(1)
  })

  it('suma a los PS actuales lo que crecen los PS máximos', () => {
    const mon = createMon(POKEMON.Bulbasaur, 5)
    mon.hp = 1
    const oldMax = maxHp(mon)
    gainExp(mon, expToNext(5))
    expect(mon.hp).toBe(1 + maxHp(mon) - oldMax)
  })

  it('no supera el nivel máximo', () => {
    const mon = createMon(POKEMON.Bulbasaur, MAX_LEVEL - 1)
    gainExp(mon, 10 ** 9)
    expect(mon.level).toBe(MAX_LEVEL)
    expect(mon.exp).toBe(0)
  })
})
