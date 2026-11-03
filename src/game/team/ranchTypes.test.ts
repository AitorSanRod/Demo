import { describe, expect, it } from 'vitest'
import { RANCH_TYPE_IDS, RANCH_TYPE_MAX_OWNED, RANCH_TYPES } from '../../data/ranchTypes'
import { initialState } from '../core/state'
import { buyRanchType, placeRanchType, ranchTypeAvailable, ranchTypeBuyBlocker, ranchTypeOwned, removeRanchType } from './ranchTypes'

const [A, B] = RANCH_TYPE_IDS
const PRICE = RANCH_TYPES[A].price

describe('comprar tipos de rancho', () => {
  it('cobra su precio y se guarda', () => {
    const s = initialState()
    s.money = PRICE
    expect(buyRanchType(s, A)).toBe(true)
    expect(s.money).toBe(0)
    expect(ranchTypeOwned(s, A)).toBe(1)
    expect(ranchTypeAvailable(s, A)).toBe(1)
  })

  it('sin dinero no se compra', () => {
    const s = initialState()
    s.money = PRICE - 1
    expect(ranchTypeBuyBlocker(s, A)).toMatch(/₽/)
    expect(buyRanchType(s, A)).toBe(false)
  })

  it(`como mucho ${RANCH_TYPE_MAX_OWNED} de cada tipo, contando los colocados`, () => {
    const s = initialState()
    s.money = 1e9
    for (let i = 0; i < RANCH_TYPE_MAX_OWNED; i++) buyRanchType(s, A)
    placeRanchType(s, 0, A)
    expect(buyRanchType(s, A)).toBe(false)
    expect(ranchTypeOwned(s, A)).toBe(RANCH_TYPE_MAX_OWNED)
  })
})

describe('colocar y quitar', () => {
  it('colocarlo lo usa; quitarlo lo devuelve a la reserva', () => {
    const s = initialState()
    s.money = 1e9
    buyRanchType(s, A)
    expect(placeRanchType(s, 0, A)).toBe(true)
    expect(s.ranchTypeOf[0]).toBe(A)
    expect(ranchTypeAvailable(s, A)).toBe(0)
    expect(removeRanchType(s, 0)).toBe(true)
    expect(s.ranchTypeOf[0]).toBeUndefined()
    expect(ranchTypeAvailable(s, A)).toBe(1)
  })

  it('sin objetos guardados o en un rancho que no tienes no se coloca', () => {
    const s = initialState()
    s.money = 1e9
    expect(placeRanchType(s, 0, A)).toBe(false)
    buyRanchType(s, A)
    expect(placeRanchType(s, 5, A)).toBe(false)
  })

  it('poner otro tipo encima devuelve el anterior a la reserva', () => {
    const s = initialState()
    s.money = 1e9
    buyRanchType(s, A)
    buyRanchType(s, B)
    placeRanchType(s, 0, A)
    placeRanchType(s, 0, B)
    expect(s.ranchTypeOf[0]).toBe(B)
    expect(ranchTypeAvailable(s, A)).toBe(1)
  })
})
