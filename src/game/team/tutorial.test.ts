import { describe, expect, it, vi } from 'vitest'
import { pathFrom, route, RouteId } from '../../data/maps'
import { SPECIES, STARTERS } from '../../data/species'
import { combine, piecesOf } from '../collection/pieces'
import { activeMon, initialState, TutorialStep } from '../core/state'
import { startRun } from '../run/run'
import { pickStarter, STARTER_PIECES, tutorialStarter } from './tutorial'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const [STARTER, OTHER_STARTER] = STARTERS
const NOT_A_STARTER = SPECIES.find((sp) => !STARTERS.includes(sp.id))!.id


describe('tutorial', () => {
  it('empieza eligiendo inicial', () => {
    expect(initialState().tutorial).toBe(TutorialStep.Starter)
  })

  it('elegir inicial da sus piezas, justas para combinarlo', () => {
    const s = initialState()
    pickStarter(s, STARTER)
    expect(piecesOf(s, STARTER)).toBe(STARTER_PIECES)
    expect(tutorialStarter(s)).toBe(STARTER)
    expect(s.seen).toContain(STARTER)
    expect(s.tutorial).toBe(TutorialStep.Combine)
  })

  it('solo se puede elegir un inicial, y solo de los tres', () => {
    const s = initialState()
    pickStarter(s, NOT_A_STARTER)
    expect(s.tutorial).toBe(TutorialStep.Starter)
    pickStarter(s, STARTER)
    pickStarter(s, OTHER_STARTER)
    expect(piecesOf(s, OTHER_STARTER)).toBe(0)
  })

  it('combinar el inicial lo hace activo y lleva a la primera ruta; salir termina el tutorial', () => {
    const s = initialState()
    pickStarter(s, STARTER)
    combine(s, STARTER)
    expect(activeMon(s)?.speciesId).toBe(STARTER)
    expect(s.tutorial).toBe(TutorialStep.Route)
    startRun(s, RouteId.PuebloPaleta, pathFrom(route(RouteId.PuebloPaleta)))
    expect(s.run).not.toBeNull()
    expect(s.tutorial).toBeNull()
  })
})
