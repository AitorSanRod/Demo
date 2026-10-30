import { describe, expect, it } from 'vitest'
import { POKEMON } from '../../data/pokemon'
import { initialState } from '../core/state'
import { species } from '../../data/species'
import { isFavorite, knownName, markSeen, toggleFavorite } from './dex'

describe('knownName', () => {
  it('oculta el nombre hasta que la especie se ha visto', () => {
    const s = initialState()
    expect(knownName(s, POKEMON.Pidgey)).toBe('???')
    markSeen(s, POKEMON.Pidgey)
    expect(knownName(s, POKEMON.Pidgey)).toBe(species(POKEMON.Pidgey).name)
  })
})

describe('toggleFavorite', () => {
  it('marca y desmarca una especie vista', () => {
    const s = initialState()
    markSeen(s, POKEMON.Pidgey)
    toggleFavorite(s, POKEMON.Pidgey)
    expect(isFavorite(s, POKEMON.Pidgey)).toBe(true)
    toggleFavorite(s, POKEMON.Pidgey)
    expect(isFavorite(s, POKEMON.Pidgey)).toBe(false)
  })

  it('no marca especies que aún no se han visto', () => {
    const s = initialState()
    toggleFavorite(s, POKEMON.Pidgey)
    expect(isFavorite(s, POKEMON.Pidgey)).toBe(false)
  })
})
