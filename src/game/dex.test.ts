import { describe, expect, it } from 'vitest'
import { isFavorite, markSeen, toggleFavorite } from './dex'
import { initialState } from './state'

const PIDGEY = 16

describe('toggleFavorite', () => {
  it('marca y desmarca una especie vista', () => {
    const s = initialState()
    markSeen(s, PIDGEY)
    toggleFavorite(s, PIDGEY)
    expect(isFavorite(s, PIDGEY)).toBe(true)
    toggleFavorite(s, PIDGEY)
    expect(isFavorite(s, PIDGEY)).toBe(false)
  })

  it('no marca especies que aún no se han visto', () => {
    const s = initialState()
    toggleFavorite(s, PIDGEY)
    expect(isFavorite(s, PIDGEY)).toBe(false)
  })
})
