import { describe, expect, it } from 'vitest'
import { Pokemon } from '../../data/pokemon'
import { initialState } from '../core/state'
import { isFavorite, markSeen, toggleFavorite } from './dex'


describe('toggleFavorite', () => {
  it('marca y desmarca una especie vista', () => {
    const s = initialState()
    markSeen(s, Pokemon.Pidgey)
    toggleFavorite(s, Pokemon.Pidgey)
    expect(isFavorite(s, Pokemon.Pidgey)).toBe(true)
    toggleFavorite(s, Pokemon.Pidgey)
    expect(isFavorite(s, Pokemon.Pidgey)).toBe(false)
  })

  it('no marca especies que aún no se han visto', () => {
    const s = initialState()
    toggleFavorite(s, Pokemon.Pidgey)
    expect(isFavorite(s, Pokemon.Pidgey)).toBe(false)
  })
})
