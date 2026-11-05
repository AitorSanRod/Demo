import { describe, expect, it, vi } from 'vitest'
import { STARTERS } from '../src/data/species'
import { cloudUpload } from '../src/game/core/cloudSave'
import { initialState } from '../src/game/core/state'
import { chooseStarter } from '../src/game/core/test-utils'
import { RaidAction, RoomSlot } from '../src/game/raid/online/protocol'
import { stopChannel } from '../src/game/raid/online/online-test-utils'
import { MailKind, sendMail } from './mail'
import { testWorker } from './test/api'

vi.mock('./mail', async (original) => ({ ...(await original<typeof import('./mail')>()), sendMail: vi.fn() }))
vi.mock('../src/data/maps/kantoMaps', () => import('../src/game/core/test-map'))

async function signedIn() {
  const api = testWorker()
  await api.call('/api/auth/signup', { body: { email: 'misty@celeste.es', password: 'staryu1234' } })
  const token = vi.mocked(sendMail).mock.calls.filter((c) => c[2] === MailKind.Confirm).at(-1)![3].split('=')[1]
  await api.call('/api/auth/confirm', { body: { token } })
  return api
}

function upload(money: number, baseRevision: number | null) {
  const s = initialState()
  chooseStarter(s, STARTERS[0])
  s.money = money
  return { baseRevision, ...cloudUpload(s) }
}

describe('partida en la nube', () => {
  it('sin sesión no hay partida', async () => {
    expect((await testWorker().call('/api/save')).status).toBe(401)
  })

  it('se sube encima de la última revisión; encima de una vieja, 409 con la de la nube', async () => {
    const api = await signedIn()
    expect((await api.call('/api/save')).data.cloud).toBeNull()
    expect((await api.call('/api/save', { body: upload(100, null) })).data.revision).toBe(1)
    expect((await api.call('/api/save', { body: upload(200, 1) })).data.revision).toBe(2)
    const stale = await api.call('/api/save', { body: upload(300, 1) })
    expect(stale.status).toBe(409)
    expect(stale.data.cloud).toMatchObject({ revision: 2, save: { money: 200 } })
    expect((await api.call('/api/save', { body: upload(300, null) })).status).toBe(409)
  })
})

describe('salas compartidas', () => {
  const mon = (uid: string) => ({ uid, speciesId: STARTERS[0], level: 15, stars: 0, hpFraction: 1, passives: [] })
  const join = (playerId: string, uid: string, channel: object = { slot: RoomSlot.Tab }) => ({
    action: RaidAction.Join,
    playerId,
    nickname: playerId,
    channel,
    targetRoomId: null,
    mon: mon(uid),
    bossHp: null,
  })
  const feed = (playerId: string) => ({ action: RaidAction.Feed, playerId, nickname: playerId, watchRoomId: null })

  it('la pestaña Raids la decide el servidor: sin nadie jugando, el frontal es la sala principal del jefe actual', async () => {
    const api = testWorker()
    const { feed: f } = (await api.call('/api/raid', { body: feed('player-aaaa') })).data
    expect(f).toMatchObject({ bossIndex: 0, phase: 'active', nextAt: null, routeRooms: [] })
    expect(f.rooms).toHaveLength(1)
    expect(f.featured.roomId).toBe(f.rooms[0].roomId)
    const again = (await api.call('/api/raid', { body: feed('player-bbbb') })).data.feed
    expect(again.featured.roomId).toBe(f.featured.roomId)
  })

  it('quien entra sin elegir sala va a la del frontal, y la lista lo cuenta', async () => {
    const api = testWorker()
    const front = (await api.call('/api/raid', { body: feed('player-aaaa') })).data.feed.featured
    const view = (await api.call('/api/raid', { body: join('player-aaaa', 'a1') })).data.view
    expect(view.roomId).toBe(front.roomId)
    const { rooms } = (await api.call('/api/raid', { body: feed('player-bbbb') })).data.feed
    expect(rooms).toMatchObject([{ roomId: front.roomId, players: 1 }])
  })

  it('las salas de las paradas de ruta con jugadores salen aparte, solo para mirar', async () => {
    const api = testWorker()
    await api.call('/api/raid', { body: join('player-aaaa', 'a1', stopChannel()) })
    const { routeRooms } = (await api.call('/api/raid', { body: feed('player-bbbb') })).data.feed
    expect(routeRooms).toMatchObject([{ players: 1, place: { routeId: stopChannel().routeId } }])
  })

  it('dos jugadores que entran contra el mismo jefe acaban en la misma sala y se ven', async () => {
    const api = testWorker()
    const a = (await api.call('/api/raid', { body: join('player-aaaa', 'a1') })).data.view
    const b = (await api.call('/api/raid', { body: join('player-bbbb', 'b1') })).data.view
    expect(b.roomId).toBe(a.roomId)
    const sync = { action: RaidAction.Sync, playerId: 'player-aaaa', nickname: 'A', roomId: a.roomId, mon: mon('a1') }
    const again = (await api.call('/api/raid', { body: sync })).data.view
    expect(again.raid.members.map((m: { kind: string }) => m.kind).sort()).toEqual(['guest', 'player'])
  })

  it('una petición mal formada se rechaza', async () => {
    expect((await testWorker().call('/api/raid', { body: { action: 'join' } })).status).toBe(400)
  })
})
