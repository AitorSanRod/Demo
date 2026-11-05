import { describe, expect, it, vi } from 'vitest'
import { route, RouteId } from '../../data/maps'
import { initialState } from '../core/state'
import { unlockReachedRoutes } from './routeUnlocks'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const FIRST = RouteId.PuebloPaleta

describe('unlockReachedRoutes', () => {
  it('abre la ruta que desbloquea una ya completada aunque no se abriera al completarla', () => {
    const s = initialState()
    const next = route(FIRST).unlocks!
    s.completedRoutes.push(FIRST)
    unlockReachedRoutes(s)
    expect(s.unlockedRoutes).toContain(next)
    unlockReachedRoutes(s)
    expect(s.unlockedRoutes.filter((id) => id === next)).toHaveLength(1)
  })

  it('no abre nada sin rutas completadas y no falla con rutas que ya no existen', () => {
    const s = initialState()
    const before = [...s.unlockedRoutes]
    s.completedRoutes.push('ruta-borrada')
    unlockReachedRoutes(s)
    expect(s.unlockedRoutes).toEqual(before)
  })
})
