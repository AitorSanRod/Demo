import { describe, expect, it } from 'vitest'
import { chooseStarter } from './engine'
import { sendExpedition } from './expedition'
import { healCost, healInstant, restInRanch, setMove, train } from './ranch'
import { startRun } from './run'
import { activeMon, initialState } from './state'
import { maxHp } from './stats'

function stateWithStarter() {
  const s = initialState()
  chooseStarter(s, 1)
  return s
}

describe('rancho', () => {
  it('curar cuesta dinero y deja los PS al máximo', () => {
    const s = stateWithStarter()
    const mon = activeMon(s)!
    mon.hp = 1
    const money = s.money
    expect(healInstant(s, mon.uid)).toBe(true)
    expect(mon.hp).toBe(maxHp(mon))
    expect(s.money).toBe(money - healCost(mon))
  })

  it('no se puede curar ni entrenar a un Pokémon que está en ruta', () => {
    const s = stateWithStarter()
    const mon = activeMon(s)!
    startRun(s, 'ruta-1')
    mon.hp = 1
    expect(healInstant(s, mon.uid)).toBe(false)
    expect(train(s, mon.uid)).toBeNull()
  })

  it('los Pokémon de expedición no descansan', () => {
    const s = stateWithStarter()
    const mon = activeMon(s)!
    mon.hp = 5
    sendExpedition(s, mon.uid, 'ruta-1', 15)
    restInRanch(s, 60)
    expect(mon.hp).toBe(5)
  })

  it('solo permite elegir un movimiento que el Pokémon conoce', () => {
    const s = stateWithStarter()
    const mon = activeMon(s)!
    setMove(s, mon.uid, 'tackle')
    expect(mon.moveId).toBe('tackle')
    setMove(s, mon.uid, 'surf')
    expect(mon.moveId).toBe('tackle')
  })
})
