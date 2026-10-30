import { describe, expect, it } from 'vitest'
import { createMon } from '../team/mons'
import { activeMon, initialState } from './state'
import { backupTeam, parseTeamBackup, restoreTeam, type TeamBackup } from './teamBackup'

const PIDGEY = 16
const CHARMANDER = 4

function stateWithTeam() {
  const s = initialState()
  const pidgey = createMon(PIDGEY, 8)
  pidgey.exp = 30
  pidgey.stars = 2
  const charmander = createMon(CHARMANDER, 12)
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
      [PIDGEY, 8, 30, 2],
      [CHARMANDER, 12, 0, 0],
    ])
    expect(activeMon(s)?.speciesId).toBe(CHARMANDER)
  })

  it('al recuperar el equipo se salta el tutorial y cuentan como capturados', () => {
    const s = initialState()
    restoreTeam(s, roundTrip(backupTeam(stateWithTeam()))!)
    expect(s.tutorial).toBeNull()
    expect(s.caught).toEqual(expect.arrayContaining([PIDGEY, CHARMANDER]))
  })

  it('no toca una partida que ya tiene Pokémon', () => {
    const s = initialState()
    s.owned.push(createMon(1, 5))
    restoreTeam(s, roundTrip(backupTeam(stateWithTeam()))!)
    expect(s.owned).toHaveLength(1)
  })

  it('con la copia vacía (p. ej. tras reiniciar) la partida nueva empieza con el tutorial', () => {
    const s = initialState()
    restoreTeam(s, roundTrip(backupTeam(initialState()))!)
    expect(s.owned).toHaveLength(0)
    expect(s.tutorial).toBe('starter')
  })

  it('descarta los Pokémon inválidos y entonces no se fía del índice del activo', () => {
    const backup = parseTeamBackup({
      format: 1,
      activeIndex: 2,
      mons: [
        { speciesId: PIDGEY, level: 8, exp: 0, stars: 0 },
        { speciesId: 9999, level: 8, exp: 0, stars: 0 },
        { speciesId: CHARMANDER, level: 500, exp: 0, stars: 0 },
        { speciesId: CHARMANDER, level: 10, exp: 0, stars: 0 },
      ],
    })!
    expect(backup.mons.map((m) => m.speciesId)).toEqual([PIDGEY, CHARMANDER])
    expect(backup.activeIndex).toBeNull()
  })

  it('ignora datos que no son una copia del equipo', () => {
    expect(parseTeamBackup(null)).toBeNull()
    expect(parseTeamBackup('hola')).toBeNull()
    expect(parseTeamBackup({ format: 99, mons: [] })).toBeNull()
  })
})
