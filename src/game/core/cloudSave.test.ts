import { describe, expect, it, vi } from 'vitest'
import { RouteId } from '../../data/maps'
import { STARTERS } from '../../data/species'
import { EXPEDITION_DURATIONS } from '../team/expedition'
import { CloudAction, cloudAction, cloudUpload, parseUpload, saveSummary, stateFromSaved } from './cloudSave'
import { initialState, SAVE_VERSION } from './state'
import { backupTeam } from './teamBackup'
import { chooseStarter } from './test-utils'

vi.mock('../../data/maps/kantoMaps', () => import('./test-map'))

const USER = 'user-1'

function playedGame() {
  const s = initialState()
  chooseStarter(s, STARTERS[0])
  return s
}

describe('partida en la nube', () => {
  it('sin copia en la nube, se sube la de aquí', () => {
    expect(cloudAction(null, USER, null, playedGame())).toBe(CloudAction.Upload)
  })

  it('si la de aquí ya es de la cuenta: baja la de la nube si otro dispositivo subió después y, si no, sube', () => {
    const link = { userId: USER, revision: 3 }
    expect(cloudAction(link, USER, { revision: 4 }, playedGame())).toBe(CloudAction.Download)
    expect(cloudAction(link, USER, { revision: 3 }, playedGame())).toBe(CloudAction.Upload)
  })

  it('si la de aquí no es de la cuenta: pregunta, salvo que esté sin empezar (entonces baja sin preguntar)', () => {
    expect(cloudAction(null, USER, { revision: 1 }, playedGame())).toBe(CloudAction.Ask)
    expect(cloudAction({ userId: 'otra', revision: 9 }, USER, { revision: 1 }, playedGame())).toBe(CloudAction.Ask)
    expect(cloudAction(null, USER, { revision: 1 }, initialState())).toBe(CloudAction.Download)
  })

  it('una copia de esta versión se recupera tal cual; de otra, se migra sin perder nada (ver saveMigration.test.ts)', () => {
    const s = playedGame()
    s.money = 1234
    const { save, team } = cloudUpload(s)
    expect(stateFromSaved(save, team)).toMatchObject({ money: 1234, owned: [{ speciesId: STARTERS[0] }] })

    const old = stateFromSaved({ ...save, version: SAVE_VERSION - 1 }, team)
    expect(old.money).toBe(1234)
    expect(old.owned.map((m) => m.speciesId)).toEqual([STARTERS[0]])
    expect(stateFromSaved(null, null).owned).toEqual([])
  })

  it('de una partida de otra versión se recuperan el equipo y sus expediciones, aunque la copia del equipo sea vieja', () => {
    const s = playedGame()
    s.expeditions.push({ uid: s.owned[0].uid, routeId: RouteId.PuebloPaleta, durationMin: EXPEDITION_DURATIONS[0], elapsedMin: 1 })
    const { expeditions: _, savedAt: __, ...oldTeam } = backupTeam(s)
    const restored = stateFromSaved({ ...s, version: SAVE_VERSION - 1 }, oldTeam)
    expect(restored.owned.map((m) => m.speciesId)).toEqual(s.owned.map((m) => m.speciesId))
    expect(restored.expeditions).toEqual([{ ...s.expeditions[0], uid: restored.owned[0].uid }])
    expect(restored.lastTick).toBe(s.lastTick)
  })

  it('si la partida guardada no se puede leer, el equipo sale de su copia', () => {
    const s = playedGame()
    expect(stateFromSaved({ version: SAVE_VERSION - 1, owned: 'roto' }, backupTeam(s)).owned).toHaveLength(1)
  })

  it('el resumen cuenta Pokémon, nivel más alto y dinero', () => {
    const s = playedGame()
    expect(saveSummary(s)).toMatchObject({ mons: 1, topLevel: s.owned[0].level, money: s.money })
  })

  it('solo se acepta subir una partida con revisión de base y copia del equipo válidas', () => {
    const up = cloudUpload(playedGame())
    expect(parseUpload({ baseRevision: null, ...up })).not.toBeNull()
    expect(parseUpload({ baseRevision: 2, ...up })).not.toBeNull()
    expect(parseUpload({ baseRevision: -1, ...up })).toBeNull()
    expect(parseUpload({ baseRevision: null, save: 'nada', team: up.team })).toBeNull()
    expect(parseUpload({ baseRevision: null, save: up.save, team: null })).toBeNull()
    expect(parseUpload(null)).toBeNull()
  })
})
