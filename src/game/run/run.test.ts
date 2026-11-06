import { describe, expect, it, vi } from 'vitest'
import { legSteps, pathFrom, route, RouteId } from '../../data/maps'
import { PASSIVE_THRESHOLDS } from '../../data/passives'
import { POKEMON } from '../../data/pokemon'
import { makeFighter } from '../battle/battle'
import { EXP_LEVEL_GAP, expReward, moneyReward } from '../battle/rewards'
import { activeMon, initialState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { createMon } from '../team/mons'
import { ranchPassives } from '../team/ranchPassives'
import { maxHp, stepsPerMinute } from '../team/stats'
import { advanceRun, endRun, runBlocker, startRun, tapRun, walk } from './run'
import { BATTLE_EVENT_MS, battleDuration, battleMoment } from './battleTimeline'
import { BOSS_MONEY_MULT, BOSS_TICKETS } from './runBattle'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const ROUTE = RouteId.PuebloPaleta

function stateOnRoute(level = 5) {
  const s = initialState()
  chooseStarter(s, POKEMON.Charmander)
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
    chooseStarter(s, POKEMON.Charmander)
    startRun(s, ROUTE, ['s', 'a'])
    expect(s.run).toBeNull()
  })

  it('no sale a una ruta bloqueada', () => {
    const s = initialState()
    chooseStarter(s, POKEMON.Charmander)
    // Al empezar solo está desbloqueada la primera ruta
    startRun(s, RouteId.Ruta1)
    expect(s.run).toBeNull()
  })

  it('no sale con el Pokémon debilitado', () => {
    const s = initialState()
    chooseStarter(s, POKEMON.Charmander)
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

  it('ganar da EXP según el nivel del rival, y se suma al acabar el combate', () => {
    const s = stateOnRoute(route(ROUTE).levels[0])
    const mon = activeMon(s)!
    walk(s, firstLeg(s))
    const { rewards, outcome, enemy, player } = s.run!.lastBattle!
    expect(rewards.exp).toBe(outcome === 'win' ? expReward(enemy.level, player.level) : 0)
    expect(mon.exp).toBe(0)
    advanceRun(s, s.run!.battleMsLeft)
    expect(s.run!.earned.exp).toBe(rewards.exp)
  })

  it(`un rival con más de ${EXP_LEVEL_GAP} niveles menos no da EXP`, () => {
    const s = stateOnRoute(50)
    const mon = activeMon(s)!
    walk(s, firstLeg(s))
    advanceRun(s, s.run!.battleMsLeft)
    expect(s.run!.lastBattle!.rewards.exp).toBe(0)
    expect(mon.exp).toBe(0)
  })
})

describe('pasivas del rancho', () => {
  it('el Pokémon de la ruta lleva las pasivas de su rancho', () => {
    const s = initialState()
    chooseStarter(s, POKEMON.Charmander)
    const mon = activeMon(s)!
    for (let i = 1; i < PASSIVE_THRESHOLDS[0]; i++) s.owned.push(createMon(POKEMON.Charmander, mon.level))
    expect(ranchPassives(s, mon.ranch!).length).toBeGreaterThan(0)
    startRun(s, ROUTE)
    walk(s, firstLeg(s))
    const plain = makeFighter('player', mon.speciesId, mon.level, { stars: mon.stars })
    expect(s.run!.lastBattle!.player.maxHp).toBeGreaterThanOrEqual(plain.maxHp)
    expect(s.run!.lastBattle!.events.length).toBeGreaterThan(0)
  })

  it('al acabar el combate los PS vuelven a la escala del Pokémon, sin pasar de su máximo', () => {
    const s = initialState()
    chooseStarter(s, POKEMON.Charmander)
    const mon = activeMon(s)!
    mon.level = 50
    for (let i = 1; i < PASSIVE_THRESHOLDS[1]; i++) s.owned.push(createMon(POKEMON.Charmander, mon.level))
    mon.hp = maxHp(mon)
    startRun(s, ROUTE)
    walk(s, firstLeg(s))
    advanceRun(s, s.run!.battleMsLeft)
    expect(mon.hp).toBeLessThanOrEqual(maxHp(mon))
  })
})

describe('ganar un combate', () => {
  it('no cura al Pokémon', () => {
    const s = stateOnRoute(50)
    const mon = activeMon(s)!
    mon.hp = Math.floor(maxHp(mon) / 2)
    const before = mon.hp
    walk(s, firstLeg(s))
    advanceRun(s, s.run!.battleMsLeft)
    expect(s.run!.earned.wins).toBe(1)
    expect(mon.hp).toBeLessThanOrEqual(before)
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
    advanceRun(s, 2000)
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
    expect(s.run!.unlocked).toBe(route(ROUTE).unlocks)
  })

  it('el premio final solo se da la primera vez que se completa', () => {
    // Con rng alto ningún salvaje suelta ticket: la diferencia entre ambas vueltas es el premio final
    const noDrops = () => 0.99
    const s = stateOnRoute(50)
    const mon = activeMon(s)!
    advanceRun(s, PLENTY_MS, noDrops)
    const first = { ...s.run!.earned }
    endRun(s)
    const expAfterFirst = mon.exp
    startRun(s, ROUTE)
    advanceRun(s, PLENTY_MS, noDrops)
    const { reward } = route(ROUTE)
    expect(s.run!.phase).toBe('complete')
    expect(first.tickets - s.run!.earned.tickets).toBe(reward.tickets)
    expect(s.run!.earned.exp).toBe(0)
    expect(s.run!.unlocked).toBeNull()
    expect(mon.exp).toBe(expAfterFirst)
  })

  it('las piezas que sueltan los salvajes se suman al acabar cada combate', () => {
    // Con rng muy bajo cada salvaje derrotado suelta pieza
    const s = stateOnRoute(50)
    advanceRun(s, PLENTY_MS, () => 0.001)
    const { pieces, wins } = s.run!.earned
    expect(pieces).toHaveLength(wins)
    expect(s.pieces[pieces[0]]).toBe(pieces.filter((p) => p === pieces[0]).length)
  })

  it('si cae derrotado la ruta termina y pierde parte de lo ganado', () => {
    const s = stateOnRoute(1)
    activeMon(s)!.hp = 1
    s.run!.earned.money = 100
    s.money = 100
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

  it('en combate salta justo al siguiente evento', () => {
    const s = stateOnRoute(50)
    walk(s, firstLeg(s))
    const battle = s.run!.lastBattle!
    tapRun(s)
    expect(battleMoment(battle, s.run!.battleMsLeft)).toMatchObject({ index: 1, msToNext: BATTLE_EVENT_MS[battle.events[1].kind] })
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

describe('jefes', () => {

  /** Ruta con jefe, con el Pokémon fuerte para ganar siempre y rng alto para que ningún salvaje suelte ticket */
  function stateBeforeBoss() {
    const s = initialState()
    chooseStarter(s, POKEMON.Charmander)
    const mon = activeMon(s)!
    mon.level = 60
    mon.hp = maxHp(mon)
    s.unlockedRoutes.push(RouteId.Ruta1)
    startRun(s, RouteId.Ruta1)
    const run = s.run!
    while (run.stop < run.path.length - 2) {
      advanceRun(s, run.battleMsLeft, () => 0.99)
      walk(s, 1e6, () => 0.99)
    }
    advanceRun(s, run.battleMsLeft, () => 0.99)
    return s
  }

  it('la última parada es siempre el jefe de la ruta a su nivel fijo', () => {
    const s = stateBeforeBoss()
    const boss = route(RouteId.Ruta1).nodes.at(-1)!.boss!
    walk(s, 1e6, () => 0.99)
    const battle = s.run!.lastBattle!
    expect(battle.boss).toBe(true)
    expect(battle.enemy).toMatchObject({ speciesId: boss.speciesId, level: boss.level })
  })

  it('derrotar al jefe da sus tickets fijos y multiplica el dinero de un salvaje de su nivel', () => {
    const s = stateBeforeBoss()
    walk(s, 1e6, () => 0.99)
    const { rewards, outcome } = s.run!.lastBattle!
    expect(outcome).toBe('win')
    expect(rewards.tickets).toBe(BOSS_TICKETS)
    const level = s.run!.lastBattle!.enemy.level
    const steps = legSteps(route(RouteId.Ruta1), s.run!.path, s.run!.stop)
    expect(rewards.money).toBeGreaterThanOrEqual(moneyReward(level, steps, () => 0) * BOSS_MONEY_MULT)
  })
})
