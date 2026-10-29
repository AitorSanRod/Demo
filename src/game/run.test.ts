import { describe, expect, it } from 'vitest'
import { legSteps, pathFrom, route } from '../data/maps'
import { chooseStarter } from './engine'
import { advanceRun, endRun, runBlocker, startRun, tapRun, walk } from './run'
import { battleDuration } from './runBattle'
import { activeMon, initialState } from './state'
import { maxHp, stepsPerMinute } from './stats'

const CHARMANDER = 4
const ROUTE = 'ruta-1'

function stateOnRoute(level = 5) {
  const s = initialState()
  chooseStarter(s, CHARMANDER)
  const mon = activeMon(s)!
  mon.level = level
  mon.hp = maxHp(mon)
  startRun(s, ROUTE)
  return s
}

const firstLeg = (s: ReturnType<typeof stateOnRoute>) => legSteps(route(ROUTE), s.run!.path, 1)

/** Tiempo de sobra para recorrer la ruta entera, combates incluidos */
const PLENTY_MS = 24 * 60 * 60 * 1000

describe('startRun', () => {
  it('sale caminando con el camino completo ya elegido', () => {
    const s = stateOnRoute()
    expect(s.run).toMatchObject({ routeId: ROUTE, stop: 0, phase: 'walking', path: pathFrom(route(ROUTE)) })
  })

  it('rechaza un camino que no llega al final', () => {
    const s = initialState()
    chooseStarter(s, CHARMANDER)
    startRun(s, ROUTE, ['s', 'a'])
    expect(s.run).toBeNull()
  })

  it('no sale a una ruta bloqueada', () => {
    const s = initialState()
    chooseStarter(s, CHARMANDER)
    startRun(s, 'monte-moon')
    expect(s.run).toBeNull()
  })

  it('no sale con el Pokémon debilitado', () => {
    const s = initialState()
    chooseStarter(s, CHARMANDER)
    activeMon(s)!.hp = 0
    expect(runBlocker(s)).not.toBeNull()
    startRun(s, ROUTE)
    expect(s.run).toBeNull()
  })
})

describe('walk', () => {
  it('acumula pasos sin llegar al siguiente nodo', () => {
    const s = stateOnRoute()
    walk(s, 10)
    expect(s.run).toMatchObject({ stop: 0, steps: 10 })
  })

  it('al llegar a un nodo salvaje combate y no da más pasos hasta que acaba el combate', () => {
    const s = stateOnRoute(50)
    walk(s, firstLeg(s))
    expect(s.run).toMatchObject({ stop: 1, steps: 0, phase: 'walking' })
    expect(s.run!.lastBattle?.outcome).toBe('win')
    expect(s.run!.earned.battles).toBe(1)
    expect(s.run!.battleMsLeft).toBe(battleDuration(s.run!.lastBattle!))
    expect(walk(s, 10)).toBe(0)
    expect(s.run!.steps).toBe(0)
  })

  it('el premio del combate no se aplica hasta que termina', () => {
    const s = stateOnRoute(50)
    const money = s.money
    walk(s, firstLeg(s))
    expect(s.money).toBe(money)
    advanceRun(s, s.run!.battleMsLeft)
    expect(s.money).toBe(money + s.run!.lastBattle!.rewards.money)
    expect(s.run!.earned.wins).toBe(1)
  })

  it('los combates no dan EXP', () => {
    const s = stateOnRoute(50)
    const mon = activeMon(s)!
    walk(s, firstLeg(s))
    expect(mon.exp).toBe(0)
    expect(mon.level).toBe(50)
  })
})

describe('advanceRun', () => {
  it('fuera de combate convierte el tiempo en pasos según la velocidad del Pokémon', () => {
    const s = stateOnRoute()
    const spm = stepsPerMinute(activeMon(s)!)
    advanceRun(s, 6000)
    expect(s.run!.steps).toBeCloseTo(spm / 10)
  })

  it('el tiempo de un combate se gasta en él y después se sigue caminando', () => {
    const s = stateOnRoute(50)
    walk(s, firstLeg(s))
    const pause = s.run!.battleMsLeft
    advanceRun(s, pause - 1)
    expect(s.run!.steps).toBe(0)
    advanceRun(s, 60000)
    expect(s.run!.battleMsLeft).toBe(0)
    expect(s.run!.steps).toBeGreaterThan(0)
  })

  it('al completar la ruta el Pokémon gana la EXP de su premio', () => {
    const s = stateOnRoute(50)
    const mon = activeMon(s)!
    advanceRun(s, PLENTY_MS)
    expect(s.run!.phase).toBe('complete')
    expect(s.run!.earned.exp).toBe(route(ROUTE).reward.exp)
    expect(mon.exp).toBe(route(ROUTE).reward.exp)
  })

  it('la ruta no se completa hasta que acaba el combate de la última parada', () => {
    const s = stateOnRoute(50)
    const run = s.run!
    while (run.stop < run.path.length - 1) {
      advanceRun(s, run.battleMsLeft)
      walk(s, 1e6)
    }
    expect(run.battleMsLeft).toBeGreaterThan(0)
    expect(run.phase).toBe('walking')
    expect(walk(s, 1e6)).toBe(0)
    advanceRun(s, run.battleMsLeft)
    expect(run.phase).toBe('complete')
  })

  it('con tiempo de sobra recorre la ruta entera, la completa y desbloquea la siguiente', () => {
    const s = stateOnRoute(50)
    advanceRun(s, PLENTY_MS)
    expect(s.run!.phase).toBe('complete')
    expect(s.run!.battleMsLeft).toBe(0)
    expect(s.completedRoutes).toContain(ROUTE)
    expect(s.unlockedRoutes).toContain(route(ROUTE).unlocks)
  })

  it('si cae derrotado la ruta termina y pierde parte de lo ganado', () => {
    const s = stateOnRoute(1)
    activeMon(s)!.hp = 1
    s.run!.earned.money = 100
    const moneyBefore = s.money
    advanceRun(s, PLENTY_MS)
    expect(s.run!.phase).toBe('fainted')
    expect(s.money).toBeLessThan(moneyBefore)
    expect(activeMon(s)!.exp).toBe(0)
  })
})

describe('tapRun', () => {
  it('fuera de combate da un paso', () => {
    const s = stateOnRoute()
    tapRun(s)
    expect(s.run!.steps).toBe(1)
  })

  it('en combate lo adelanta en vez de dar pasos', () => {
    const s = stateOnRoute(50)
    walk(s, firstLeg(s))
    const pause = s.run!.battleMsLeft
    tapRun(s)
    expect(s.run!.battleMsLeft).toBeLessThan(pause)
    expect(s.run!.steps).toBe(0)
  })
})

describe('endRun', () => {
  it('vuelve al rancho conservando lo ganado', () => {
    const s = stateOnRoute(50)
    walk(s, firstLeg(s))
    const money = s.money
    endRun(s)
    expect(s.run).toBeNull()
    expect(s.money).toBe(money)
  })
})
