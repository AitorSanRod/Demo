import { describe, expect, it } from 'vitest'
import { route } from '../../data/maps'
import { initialState, restoreState, SAVE_VERSION, type GameState } from './state'

describe('initialState', () => {
  it('empieza con rutas desbloqueadas que existen', () => {
    for (const id of initialState().unlockedRoutes) expect(() => route(id)).not.toThrow()
  })
})

describe('restoreState', () => {
  it('descarta partidas de otra versión', () => {
    expect(restoreState({ ...initialState(), version: SAVE_VERSION - 1 })).toBeNull()
  })

  it('completa los campos que falten con su valor inicial', () => {
    const { pieces: _, ...saved } = { ...initialState(), money: 999 }
    const restored = restoreState(saved as GameState)!
    expect(restored.pieces).toEqual({})
    expect(restored.money).toBe(999)
  })
})
