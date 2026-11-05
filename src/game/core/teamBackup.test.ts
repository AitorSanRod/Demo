import { describe, expect, it } from 'vitest'
import { RouteId } from '../../data/maps'
import { POKEMON } from '../../data/pokemon'
import { EXPEDITION_DURATIONS } from '../team/expedition'
import { createMon } from '../team/mons'
import { ranchCount } from '../team/ranches'
import { MAX_LEVEL } from '../team/stats'
import { activeMon, initialState, TutorialStep } from './state'
import { backupTeam, parseTeamBackup, restoreTeam, type TeamBackup } from './teamBackup'
import { tick } from './tick'


function stateWithTeam() {
  const s = initialState()
  const pidgey = createMon(POKEMON.Pidgey, 8)
  pidgey.exp = 30
  pidgey.stars = 2
  const charmander = createMon(POKEMON.Charmander, 12)
  s.owned.push(pidgey, charmander)
  s.activeUid = charmander.uid
  s.tutorial = null
  return s
}

/** Simula guardar en el storage y volver a leerlo */
const roundTrip = (backup: TeamBackup) => parseTeamBackup(JSON.parse(JSON.stringify(backup)))

describe('copia del equipo', () => {
  it('una partida nueva recupera el equipo con su nivel, EXP, estrellas y activo', () => {
    const backup = roundTrip(backupTeam(stateWithTeam()))!
    const s = initialState()
    restoreTeam(s, backup)
    expect(s.owned.map((m) => [m.speciesId, m.level, m.exp, m.stars])).toEqual([
      [POKEMON.Pidgey, 8, 30, 2],
      [POKEMON.Charmander, 12, 0, 0],
    ])
    expect(activeMon(s)?.speciesId).toBe(POKEMON.Charmander)
  })

  it('al recuperar el equipo se salta el tutorial y cuentan como capturados', () => {
    const s = initialState()
    restoreTeam(s, roundTrip(backupTeam(stateWithTeam()))!)
    expect(s.tutorial).toBeNull()
    expect(s.caught).toEqual(expect.arrayContaining([POKEMON.Pidgey, POKEMON.Charmander]))
  })

  it('no toca una partida que ya tiene Pokémon', () => {
    const s = initialState()
    s.owned.push(createMon(POKEMON.Bulbasaur, 5))
    restoreTeam(s, roundTrip(backupTeam(stateWithTeam()))!)
    expect(s.owned).toHaveLength(1)
  })

  it('con la copia vacía (p. ej. tras reiniciar) la partida nueva empieza con el tutorial', () => {
    const s = initialState()
    restoreTeam(s, roundTrip(backupTeam(initialState()))!)
    expect(s.owned).toHaveLength(0)
    expect(s.tutorial).toBe(TutorialStep.Starter)
  })

  it('descarta los Pokémon inválidos y entonces no se fía del índice del activo', () => {
    const backup = parseTeamBackup({
      format: 2,
      activeIndex: 2,
      mons: [
        { speciesId: POKEMON.Pidgey, level: 8, exp: 0, stars: 0, ranch: 0 },
        { speciesId: 9999, level: 8, exp: 0, stars: 0, ranch: 0 },
        { speciesId: POKEMON.Charmander, level: MAX_LEVEL + 1, exp: 0, stars: 0, ranch: 0 },
        { speciesId: POKEMON.Charmander, level: 10, exp: 0, stars: 0, ranch: 0 },
      ],
    })!
    expect(backup.mons.map((m) => m.speciesId)).toEqual([POKEMON.Pidgey, POKEMON.Charmander])
    expect(backup.activeIndex).toBeNull()
  })

  it('guarda en qué rancho o en la Caja estaba cada uno y recupera los ranchos comprados', () => {
    const team = stateWithTeam()
    team.owned[0].ranch = null
    team.owned[1].ranch = 1
    const s = initialState()
    restoreTeam(s, roundTrip(backupTeam(team))!)
    expect(s.owned.map((m) => m.ranch)).toEqual([null, 1])
    expect(ranchCount(s)).toBe(2)
  })

  it('descarta las copias del formato anterior, sin ranchos', () => {
    expect(parseTeamBackup({ format: 1, activeIndex: 0, mons: [{ speciesId: POKEMON.Pidgey, level: 8, exp: 0, stars: 0 }] })).toBeNull()
  })

  it('ignora datos que no son una copia del equipo', () => {
    expect(parseTeamBackup(null)).toBeNull()
    expect(parseTeamBackup('hola')).toBeNull()
    expect(parseTeamBackup({ format: 99, mons: [] })).toBeNull()
  })

  describe('expediciones en curso', () => {
    /** El primer Pokémon del equipo, de expedición desde hace `elapsedMin` minutos */
    function onExpedition(elapsedMin = 1) {
      const s = stateWithTeam()
      s.expeditions.push({ uid: s.owned[0].uid, routeId: RouteId.PuebloPaleta, durationMin: EXPEDITION_DURATIONS.at(-1)!, elapsedMin })
      return s
    }

    it('se conservan, con el Pokémon que la hacía aunque al rehacerlo tenga otro uid', () => {
      const s = onExpedition()
      const fresh = initialState()
      restoreTeam(fresh, roundTrip(backupTeam(s))!)
      expect(fresh.expeditions).toEqual([{ ...s.expeditions[0], uid: fresh.owned[0].uid }])
      expect(fresh.owned[0].speciesId).toBe(s.owned[0].speciesId)
    })

    it('el tiempo que pasa desde la copia cuenta para ellas, como con la app cerrada', () => {
      const s = onExpedition()
      const fresh = initialState()
      restoreTeam(fresh, roundTrip(backupTeam(s))!)
      expect(fresh.lastTick).toBe(s.lastTick)
      tick(fresh, s.lastTick + 5 * 60_000)
      expect(fresh.expeditions[0].elapsedMin).toBeCloseTo(s.expeditions[0].elapsedMin + 5)
    })

    it('se descartan las que no encajan (ruta que no existe, duración que no hay, el mismo Pokémon dos veces)', () => {
      const backup = backupTeam(onExpedition())
      const good = backup.expeditions![0]
      const parsed = roundTrip({
        ...backup,
        expeditions: [good, { ...good }, { ...good, monIndex: 1, routeId: 'no-existe' }, { ...good, monIndex: 1, durationMin: -1 }],
      })
      expect(parsed!.expeditions).toEqual([good])
    })

    it('las copias de antes, sin expediciones, siguen valiendo', () => {
      const { expeditions: _, savedAt: __, ...old } = backupTeam(onExpedition())
      const fresh = initialState()
      restoreTeam(fresh, roundTrip(old as TeamBackup)!)
      expect(fresh.owned).toHaveLength(2)
      expect(fresh.expeditions).toEqual([])
    })
  })
})
