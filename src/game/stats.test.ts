import { describe, expect, it } from 'vitest'
import { species } from '../data/species'
import { createMon } from './engine'
import { calcStats, expToNext, gainExp, MAX_LEVEL, maxHp } from './stats'

const BULBASAUR = 1

describe('calcStats', () => {
  it('las stats crecen con el nivel', () => {
    expect(calcStats(BULBASAUR, 50).atk).toBeGreaterThan(calcStats(BULBASAUR, 10).atk)
  })

  it('cada estrella da un +4% sobre las stats sin estrellas', () => {
    const base = calcStats(BULBASAUR, 50)
    const starred = calcStats(BULBASAUR, 50, 5)
    const atk = species(BULBASAUR).base.atk
    expect(starred.atk).toBe(Math.floor(((2 * atk * 50) / 100 + 5) * 1.2))
    expect(starred.hp).toBeGreaterThan(base.hp)
  })
})

describe('species', () => {
  it('el ataque es el mayor entre el físico y el especial de PokeAPI', () => {
    // Bulbasaur: atk 49, spa 65
    expect(species(BULBASAUR).base.atk).toBe(65)
  })

  it('la defensa es la media entre la física y la especial de PokeAPI', () => {
    // Bulbasaur: def 49, spd 65
    expect(species(BULBASAUR).base.def).toBe(57)
  })
})

describe('createMon', () => {
  it('empieza con su movimiento más potente y, en empate, el de su tipo', () => {
    // Charmander Nv. 5 conoce Arañazo y Ascuas, ambos de potencia 40
    expect(createMon(4, 5).moveId).toBe('ember')
  })
})

describe('gainExp', () => {
  it('sube de nivel justo al alcanzar la EXP necesaria', () => {
    const mon = createMon(BULBASAUR, 5)
    const result = gainExp(mon, expToNext(5))
    expect(mon.level).toBe(6)
    expect(mon.exp).toBe(0)
    expect(result.levelsGained).toBe(1)
  })

  it('suma a los PS actuales lo que crecen los PS máximos', () => {
    const mon = createMon(BULBASAUR, 5)
    mon.hp = 1
    const oldMax = maxHp(mon)
    gainExp(mon, expToNext(5))
    expect(mon.hp).toBe(1 + maxHp(mon) - oldMax)
  })

  it('no supera el nivel máximo', () => {
    const mon = createMon(BULBASAUR, MAX_LEVEL - 1)
    gainExp(mon, 10 ** 9)
    expect(mon.level).toBe(MAX_LEVEL)
    expect(mon.exp).toBe(0)
  })

  it('equipa un movimiento aprendido si es más potente que el actual', () => {
    const mon = createMon(BULBASAUR, 13)
    const result = gainExp(mon, expToNext(13))
    expect(result.learned).toContain('razor-leaf')
    expect(mon.moveId).toBe('razor-leaf')
  })

  it('no cambia el movimiento si el aprendido es más débil', () => {
    const mon = createMon(BULBASAUR, 13)
    mon.moveId = 'energy-ball'
    gainExp(mon, expToNext(13))
    expect(mon.moveId).toBe('energy-ball')
  })
})
