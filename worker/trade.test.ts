import { describe, expect, it, vi } from 'vitest'
import { STARTERS } from '../src/data/species'
import { cloudUpload } from '../src/game/core/cloudSave'
import { initialState, type GameState } from '../src/game/core/state'
import { chooseStarter } from '../src/game/core/test-utils'
import { createMon } from '../src/game/team/mons'
import { GoodKind, LISTING_MS, MAX_OPEN_LISTINGS, type TradeAsk } from '../src/game/trade/tradeGoods'
import { applyTradeOp } from '../src/game/trade/tradeOps'
import { InboxReason, TradeAction, TradeCode } from '../src/game/trade/tradeProtocol'
import { expireListings } from './db/trades'
import { MailKind, sendMail } from './mail'
import { testWorker } from './test/api'

vi.mock('./mail', async (original) => ({ ...(await original<typeof import('./mail')>()), sendMail: vi.fn() }))
vi.mock('../src/data/maps/kantoMaps', () => import('../src/game/core/test-map'))

const [A, B, C] = STARTERS
const PRICE: TradeAsk = { kind: GoodKind.Money, count: 300 }

/** Un jugador con cuenta y la partida ya subida: el inicial de compañero, otro Pokémon en el rancho, dinero y trozos */
async function player(email: string, starter: number, other: number, env?: ReturnType<typeof testWorker>['env']) {
  const api = testWorker(env)
  await api.call('/api/auth/signup', { body: { email, password: 'pokerancho1' } })
  const token = vi.mocked(sendMail).mock.calls.filter((c) => c[1] === email && c[2] === MailKind.Confirm).at(-1)![3].split('=')[1]
  await api.call('/api/auth/confirm', { body: { token } })
  const s: GameState = initialState()
  chooseStarter(s, starter)
  s.owned.push(createMon(other, 9))
  Object.assign(s, { money: 1000, missingnoShards: 20 })
  await api.call('/api/save', { body: { baseRevision: null, ...cloudUpload(s) } })
  const me = { api, s, revision: 1, other: s.owned[1].uid }
  /** Una operación que cambia la partida: si sale bien, el «móvil» la repite sobre la suya como hace la web */
  const op = async (body: Record<string, unknown>) => {
    const res = await api.call('/api/trade', { body: { baseRevision: me.revision, ...body } })
    if (res.status === 200) {
      applyTradeOp(me.s, res.data.op)
      me.revision = res.data.revision
    }
    return res
  }
  return Object.assign(me, { op })
}

async function twoPlayers() {
  const seller = await player('misty@celeste.es', A, B)
  const buyer = await player('brock@plateada.es', B, C, seller.api.env)
  return { seller, buyer }
}

const listOther = (p: Awaited<ReturnType<typeof player>>, ask = PRICE) =>
  p.op({ action: TradeAction.List, offer: { kind: GoodKind.Mon, uid: p.other }, ask })

describe('intercambios', () => {
  it('sin sesión no hay intercambios', async () => {
    expect((await testWorker().call('/api/trade')).status).toBe(401)
  })

  it('al anunciar, el Pokémon sale de la partida de la nube y el anuncio sale en el tablón de los demás', async () => {
    const { seller, buyer } = await twoPlayers()
    expect((await listOther(seller)).status).toBe(200)
    const cloud = (await seller.api.call('/api/save')).data.cloud
    expect(cloud).toMatchObject({ revision: 2, save: { tradeStamp: 1 } })
    expect(cloud.save.owned.map((m: { speciesId: number }) => m.speciesId)).toEqual([A])
    expect(cloud.save).toEqual({ ...seller.s, lastTick: cloud.save.lastTick })
    expect((await seller.api.call('/api/trade')).data).toMatchObject({ listings: [], mine: [{ offer: { mon: { speciesId: B } } }] })
    expect((await buyer.api.call('/api/trade')).data.listings).toHaveLength(1)
    expect((await buyer.api.call(`/api/trade?species=${C}`)).data.listings).toHaveLength(0)
    expect((await buyer.api.call(`/api/trade?species=${B}`)).data.listings).toHaveLength(1)
  })

  it('solo encima de la partida que se acaba de subir', async () => {
    const { seller } = await twoPlayers()
    seller.revision = 7
    expect((await listOther(seller)).data.code).toBe(TradeCode.Stale)
  })

  it('una partida de antes de un intercambio no se puede subir encima', async () => {
    const { seller } = await twoPlayers()
    const before = structuredClone(seller.s)
    await listOther(seller)
    const res = await seller.api.call('/api/save', { body: { baseRevision: seller.revision, ...cloudUpload(before) } })
    expect(res.status).toBe(409)
    expect((await seller.api.call('/api/save', { body: { baseRevision: seller.revision, ...cloudUpload(seller.s) } })).status).toBe(200)
  })

  it(`como mucho ${MAX_OPEN_LISTINGS} anuncios abiertos`, async () => {
    const { seller } = await twoPlayers()
    for (let i = 0; i < MAX_OPEN_LISTINGS; i++) expect((await seller.op({ action: TradeAction.List, offer: { kind: GoodKind.Shards, count: 1 }, ask: PRICE })).status).toBe(200)
    expect((await seller.op({ action: TradeAction.List, offer: { kind: GoodKind.Shards, count: 1 }, ask: PRICE })).data.code).toBe(TradeCode.Full)
  })

  it('al aceptar, el pago sale del comprador y los dos lo tienen en Notificaciones; solo una vez', async () => {
    const { seller, buyer } = await twoPlayers()
    await listOther(seller)
    const [listing] = (await buyer.api.call('/api/trade')).data.listings
    expect((await buyer.op({ action: TradeAction.Accept, listingId: listing.id, uid: null })).status).toBe(200)
    expect(buyer.s.money).toBe(1000 - PRICE.count)
    expect((await buyer.op({ action: TradeAction.Accept, listingId: listing.id, uid: null })).data.code).toBe(TradeCode.Gone)
    expect(buyer.s.money).toBe(1000 - PRICE.count)

    const [bought] = (await buyer.api.call('/api/trade')).data.inbox
    expect(bought).toMatchObject({ reason: InboxReason.Bought, good: { kind: GoodKind.Mon, mon: { speciesId: B } } })
    const [sold] = (await seller.api.call('/api/trade')).data.inbox
    expect(sold).toMatchObject({ reason: InboxReason.Sold, good: PRICE })

    expect((await buyer.op({ action: TradeAction.Claim, inboxId: bought.id })).status).toBe(200)
    expect((await buyer.op({ action: TradeAction.Claim, inboxId: bought.id })).data.code).toBe(TradeCode.Gone)
    expect(buyer.s.owned.filter((m) => m.speciesId === B)).toHaveLength(1)
    expect((await seller.op({ action: TradeAction.Claim, inboxId: sold.id })).status).toBe(200)
    expect(seller.s.money).toBe(1000 + PRICE.count)
  })

  it('no se puede aceptar un anuncio propio ni pagar con lo que no se tiene', async () => {
    const { seller, buyer } = await twoPlayers()
    await listOther(seller, { kind: GoodKind.Money, count: 5000 })
    const [mine] = (await seller.api.call('/api/trade')).data.mine
    expect((await seller.op({ action: TradeAction.Accept, listingId: mine.id, uid: null })).data.code).toBe(TradeCode.Own)
    expect((await buyer.op({ action: TradeAction.Accept, listingId: mine.id, uid: null })).data.code).toBe(TradeCode.Blocked)
  })

  it('retirar o dejar caducar devuelve lo anunciado a Notificaciones', async () => {
    const { seller } = await twoPlayers()
    await listOther(seller)
    await seller.op({ action: TradeAction.List, offer: { kind: GoodKind.Shards, count: 5 }, ask: PRICE })
    const [first] = (await seller.api.call('/api/trade')).data.mine
    expect((await seller.api.call('/api/trade', { body: { action: TradeAction.Withdraw, listingId: first.id } })).data.withdrawn).toBe(true)
    expect((await seller.api.call('/api/trade', { body: { action: TradeAction.Withdraw, listingId: first.id } })).data.withdrawn).toBe(false)
    await expireListings(seller.api.env.DB, Date.now() + LISTING_MS)
    const board = (await seller.api.call('/api/trade')).data
    expect(board.mine).toHaveLength(0)
    expect(board.inbox.map((e: { reason: string }) => e.reason).sort()).toEqual([InboxReason.Expired, InboxReason.Withdrawn])
  })
})
