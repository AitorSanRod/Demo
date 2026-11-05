import { describe, expect, it, vi } from 'vitest'
import { legSteps, node, pathFrom, route, RouteId } from '../../data/maps'
import { POKEMON } from '../../data/pokemon'
import { initialState, type GameState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { startRun } from './run'
import { LANDMARK_LEAD_STEPS, landmarkInView } from './runLandmark'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

/** Partida en la ruta del mapa de pruebas cuya primera parada tiene elemento */
function runWithLandmark(): GameState {
  const s = initialState()
  chooseStarter(s, POKEMON.Charmander)
  startRun(s, RouteId.PuebloPaleta)
  return s
}

const r = () => route(RouteId.PuebloPaleta)
const firstLeg = () => legSteps(r(), pathFrom(r()), 1)
const firstLandmark = () => node(r(), pathFrom(r())[1]).landmark

describe('landmarkInView', () => {
  it('no hay elemento mientras la parada queda lejos', () => {
    const s = runWithLandmark()
    s.run!.steps = firstLeg() - LANDMARK_LEAD_STEPS - 1
    expect(landmarkInView(s.run!)).toBeNull()
  })

  it('el elemento de la parada siguiente aparece cuando faltan pocos pasos', () => {
    const s = runWithLandmark()
    s.run!.steps = firstLeg() - LANDMARK_LEAD_STEPS
    expect(landmarkInView(s.run!)).toEqual({ stop: 1, landmark: firstLandmark() })
  })

  it('sigue a la vista al llegar a la parada y al salir de ella', () => {
    const s = runWithLandmark()
    s.run!.stop = 1
    s.run!.steps = 0
    expect(landmarkInView(s.run!)).toEqual({ stop: 1, landmark: firstLandmark() })
    s.run!.steps = LANDMARK_LEAD_STEPS + 1
    expect(landmarkInView(s.run!)).toBeNull()
  })

  it('una parada sin elemento no saca ninguno', () => {
    const s = runWithLandmark()
    s.run!.stop = 1
    s.run!.steps = legSteps(r(), s.run!.path, 2)
    expect(node(r(), s.run!.path[2]).landmark).toBeUndefined()
    expect(landmarkInView(s.run!)).toBeNull()
  })
})
