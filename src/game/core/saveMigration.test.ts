import { afterEach, describe, expect, it, vi } from 'vitest'
import { route, RouteId } from '../../data/maps'
import { RanchTypeId } from '../../data/ranchTypes'
import { STARTERS } from '../../data/species'
import { Stone } from '../../data/stones'
import { startRun } from '../run/run'
import { EXPEDITION_DURATIONS } from '../team/expedition'
import { createMon } from '../team/mons'
import { UPGRADES } from '../team/upgrades'
import { stateFromSaved } from './cloudSave'
import { migrateSave, SAVE_MIGRATIONS } from './saveMigration'
import { initialState, MonPlace, monPlace, SAVE_VERSION, type GameState } from './state'
import { backupTeam } from './teamBackup'

vi.mock('../../data/maps/kantoMaps', () => import('./test-map'))

const OLD = SAVE_VERSION - 1
const [A, B, C] = STARTERS
const UNKNOWN_SPECIES = -7

/** Una partida avanzada, con algo en cada campo que se guarda */
function advancedGame(): GameState {
  const s = initialState()
  const first = createMon(A, 12, 0)
  Object.assign(first, { exp: 3, stars: 2, spot: { x: 40, y: 60 } })
  const second = createMon(B, 9, 1)
  s.owned.push(first, second)
  s.activeUid = first.uid
  s.tutorial = null
  Object.assign(s, {
    money: 12_345,
    tickets: 17,
    missingnoShards: 230,
    seen: [A, B, C],
    caught: [A, B],
    favorites: [C],
    pieces: { [A]: 4, [C]: 9 },
    upgrades: { ranches: 1, expeditionSlots: UPGRADES.expeditionSlots.prices.length },
    ranchTypeItems: { [Object.values(RanchTypeId)[0]]: 2 },
    ranchTypeOf: { 1: Object.values(RanchTypeId)[0] },
    stones: { [Stone.Fire]: 1, [Stone.Moon]: 3 },
    // Coherente: con Pueblo Paleta completada, también abierta la ruta que desbloquea
    unlockedRoutes: [RouteId.PuebloPaleta, route(RouteId.PuebloPaleta).unlocks!, RouteId.BosqueVerde],
    completedRoutes: [RouteId.PuebloPaleta],
    // El activo también puede estar de expedición (sin ruta en curso)
    expeditions: [
      { uid: second.uid, routeId: RouteId.PuebloPaleta, durationMin: EXPEDITION_DURATIONS[0], elapsedMin: 2 },
      { uid: first.uid, routeId: RouteId.PuebloPaleta, durationMin: EXPEDITION_DURATIONS.at(-1)!, elapsedMin: 7 },
    ],
    raidPrizes: [{ bossSpeciesId: C, uid: first.uid, money: 80, tickets: 1, pieces: 1, exp: 5 }],
    routeRaidStreaks: { 'bosque-verde/g': { count: 2, lastAt: 1000 } },
    lastTick: Date.now() - 60_000,
  })
  return s
}

/** Como si se hubiera guardado con la versión anterior y se leyera ahora (pasando por JSON, como en el navegador) */
const fromOldVersion = (s: GameState, version = OLD) => JSON.parse(JSON.stringify({ ...s, version }))

const KEPT: (keyof GameState)[] = [
  'money', 'tickets', 'missingnoShards', 'seen', 'caught', 'favorites', 'pieces', 'upgrades', 'ranchTypeItems', 'ranchTypeOf',
  'stones', 'tutorial', 'unlockedRoutes', 'completedRoutes', 'owned', 'activeUid', 'expeditions', 'raidPrizes', 'routeRaidStreaks', 'lastTick',
]

afterEach(() => {
  delete SAVE_MIGRATIONS[OLD]
})

describe('al actualizar el juego no se pierde nada', () => {
  it('se conserva todo: dinero, tickets, trozos, Pokédex, vistos, piezas, compras, rutas, equipo, expediciones y premios', () => {
    const s = advancedGame()
    const migrated = migrateSave(fromOldVersion(s))!
    expect(migrated.version).toBe(SAVE_VERSION)
    for (const key of KEPT) expect(migrated[key], key).toEqual(s[key])
  })

  it('también pasando por la carga normal (la del navegador y la de la nube)', () => {
    const s = advancedGame()
    const loaded = stateFromSaved(fromOldVersion(s), backupTeam(s))
    for (const key of KEPT) expect(loaded[key], key).toEqual(s[key])
  })

  it('de una partida muy antigua se conserva lo que tenía; lo que no existía entonces toma su valor inicial', () => {
    const s = advancedGame()
    const ancient = fromOldVersion(s, 1)
    for (const key of ['favorites', 'stones', 'ranchTypeOf', 'routeRaidStreaks', 'raidPrizes']) delete ancient[key]
    for (const mon of ancient.owned) delete mon.spot
    const migrated = migrateSave(ancient)!
    expect(migrated).toMatchObject({ money: s.money, pieces: s.pieces, completedRoutes: s.completedRoutes, favorites: [], stones: {}, routeRaidStreaks: {} })
    expect(migrated.owned.map((m) => [m.uid, m.level, m.spot])).toEqual(s.owned.map((m) => [m.uid, m.level, null]))
  })

  it('lo que ya no existe en el juego se descarta y el resto se queda', () => {
    const save = fromOldVersion(advancedGame())
    save.seen.push(UNKNOWN_SPECIES)
    save.pieces[UNKNOWN_SPECIES] = 5
    save.completedRoutes.push('ruta-que-ya-no-existe')
    save.stones.piedraInventada = 2
    save.upgrades.ranches = 999
    save.owned.push({ ...save.owned[0], uid: 'raro', speciesId: UNKNOWN_SPECIES })
    save.expeditions.push({ ...save.expeditions[0], uid: 'nadie' })
    const migrated = migrateSave(save)!
    expect(migrated.seen).not.toContain(UNKNOWN_SPECIES)
    expect(migrated.pieces).not.toHaveProperty(String(UNKNOWN_SPECIES))
    expect(migrated.completedRoutes).toEqual([RouteId.PuebloPaleta])
    expect(migrated.stones).not.toHaveProperty('piedraInventada')
    expect(migrated.upgrades.ranches).toBeLessThanOrEqual(UPGRADES.ranches.prices.length)
    expect(migrated.owned).toHaveLength(2)
    expect(migrated.expeditions).toHaveLength(2)
  })

  it('un campo con otra forma toma su valor inicial; los que ya no existen se ignoran', () => {
    const save = fromOldVersion(advancedGame())
    save.money = 'mucho'
    save.campoQueYaNoExiste = 42
    const migrated = migrateSave(save)!
    expect(migrated.money).toBe(initialState().money)
    expect(migrated).not.toHaveProperty('campoQueYaNoExiste')
  })

  it('solo se pierde lo que estaba a medias: la ruta en curso (su Pokémon vuelve al rancho)', () => {
    const s = advancedGame()
    s.expeditions = s.expeditions.filter((e) => e.uid !== s.activeUid)
    startRun(s, RouteId.PuebloPaleta)
    const migrated = migrateSave(fromOldVersion(s))!
    expect(migrated.run).toBeNull()
    expect(monPlace(migrated, migrated.activeUid!)).toBe(MonPlace.Ranch)
  })

  it('los capturados cuentan como vistos y las rutas completadas como desbloqueadas', () => {
    const save = fromOldVersion(advancedGame())
    save.seen = []
    save.unlockedRoutes = []
    const migrated = migrateSave(save)!
    expect(migrated.seen).toEqual(expect.arrayContaining(save.caught))
    expect(migrated.unlockedRoutes).toEqual(expect.arrayContaining(save.completedRoutes))
  })

  it('si un campo cambia de significado, su paso de SAVE_MIGRATIONS lo convierte antes del rescate', () => {
    SAVE_MIGRATIONS[OLD] = (save) => {
      save.money = (save.dinero as number) * 2
    }
    const save = fromOldVersion(advancedGame())
    save.dinero = 50
    expect(migrateSave(save)!.money).toBe(100)
  })

  it('si la partida guardada está rota, el equipo sale de su copia', () => {
    const s = advancedGame()
    const loaded = stateFromSaved({ ...fromOldVersion(s), owned: 'roto' }, backupTeam(s))
    expect(loaded.owned.map((m) => m.speciesId)).toEqual(s.owned.map((m) => m.speciesId))
    expect(loaded.money).toBe(s.money)
  })

  it('una partida de esta misma versión se carga tal cual', () => {
    const s = advancedGame()
    const loaded = stateFromSaved(JSON.parse(JSON.stringify(s)), null)
    for (const key of KEPT) expect(loaded[key], key).toEqual(s[key])
  })
})
