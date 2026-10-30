import { describe, expect, it } from 'vitest'
import { pathFrom, route } from '../../data/maps'
import { combine, piecesOf } from '../collection/pieces'
import { activeMon, initialState } from '../core/state'
import { startRun } from '../run/run'
import { pickStarter, STARTER_PIECES, tutorialStarter } from './tutorial'

const CHARMANDER = 4

describe('tutorial', () => {
  it('empieza eligiendo inicial', () => {
    expect(initialState().tutorial).toBe('starter')
  })

  it('elegir inicial da sus piezas, justas para combinarlo', () => {
    const s = initialState()
    pickStarter(s, CHARMANDER)
    expect(piecesOf(s, CHARMANDER)).toBe(STARTER_PIECES)
    expect(tutorialStarter(s)).toBe(CHARMANDER)
    expect(s.tutorial).toBe('combine')
  })

  it('solo se puede elegir un inicial, y solo de los tres', () => {
    const s = initialState()
    pickStarter(s, 16)
    expect(s.tutorial).toBe('starter')
    pickStarter(s, CHARMANDER)
    pickStarter(s, 1)
    expect(piecesOf(s, 1)).toBe(0)
  })

  it('combinar el inicial lo hace activo y lleva a la primera ruta; salir termina el tutorial', () => {
    const s = initialState()
    pickStarter(s, CHARMANDER)
    combine(s, CHARMANDER)
    expect(activeMon(s)?.speciesId).toBe(CHARMANDER)
    expect(s.tutorial).toBe('route')
    startRun(s, 'pueblo-paleta', pathFrom(route('pueblo-paleta')))
    expect(s.run).not.toBeNull()
    expect(s.tutorial).toBeNull()
  })
})
