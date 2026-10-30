import { describe, expect, it } from 'vitest'
import { pathFrom, route, RouteId } from '../../data/maps'
import { Pokemon } from '../../data/pokemon'
import { combine, piecesOf } from '../collection/pieces'
import { activeMon, initialState, TutorialStep } from '../core/state'
import { startRun } from '../run/run'
import { pickStarter, STARTER_PIECES, tutorialStarter } from './tutorial'


describe('tutorial', () => {
  it('empieza eligiendo inicial', () => {
    expect(initialState().tutorial).toBe(TutorialStep.Starter)
  })

  it('elegir inicial da sus piezas, justas para combinarlo', () => {
    const s = initialState()
    pickStarter(s, Pokemon.Charmander)
    expect(piecesOf(s, Pokemon.Charmander)).toBe(STARTER_PIECES)
    expect(tutorialStarter(s)).toBe(Pokemon.Charmander)
    expect(s.tutorial).toBe(TutorialStep.Combine)
  })

  it('solo se puede elegir un inicial, y solo de los tres', () => {
    const s = initialState()
    pickStarter(s, 16)
    expect(s.tutorial).toBe(TutorialStep.Starter)
    pickStarter(s, Pokemon.Charmander)
    pickStarter(s, 1)
    expect(piecesOf(s, 1)).toBe(0)
  })

  it('combinar el inicial lo hace activo y lleva a la primera ruta; salir termina el tutorial', () => {
    const s = initialState()
    pickStarter(s, Pokemon.Charmander)
    combine(s, Pokemon.Charmander)
    expect(activeMon(s)?.speciesId).toBe(Pokemon.Charmander)
    expect(s.tutorial).toBe(TutorialStep.Route)
    startRun(s, RouteId.PuebloPaleta, pathFrom(route(RouteId.PuebloPaleta)))
    expect(s.run).not.toBeNull()
    expect(s.tutorial).toBeNull()
  })
})
