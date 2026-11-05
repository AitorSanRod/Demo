import { describe, expect, it, vi } from 'vitest'
import { STARTERS } from '../src/data/species'
import { cloudUpload } from '../src/game/core/cloudSave'
import { initialState } from '../src/game/core/state'
import { chooseStarter } from '../src/game/core/test-utils'
import { RAID_ROTATIONS, RaidAction, RaidRotation, RoomSlot } from '../src/game/raid/online/protocol'
import { stopChannel } from '../src/game/raid/online/online-test-utils'
import { ROOM_MAX_CATCHUP_MS } from '../src/game/raid/online/sharedRoom'
import { deleteIdleStopRooms } from './db/rooms'
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

  /** La rotación `rotation` de la pestaña Raids según el servidor */
  const board = async (api: ReturnType<typeof testWorker>, rotation: RaidRotation) =>
    (await api.call('/api/raid', { body: feed('player-zzzz') })).data.feed.rotations.find((b: { rotation: string }) => b.rotation === rotation)

  it('la pestaña Raids la decide el servidor: una rotación de cada, sin nadie jugando el frontal es la sala principal', async () => {
    const api = testWorker()
    const { feed: f } = (await api.call('/api/raid', { body: feed('player-aaaa') })).data
    expect(f.routeRooms).toEqual([])
    expect(f.rotations.map((b: { rotation: string }) => b.rotation)).toEqual(RAID_ROTATIONS)
    const [ordered, random] = f.rotations
    expect(ordered).toMatchObject({ bossIndex: 0, phase: 'active', nextAt: null })
    expect(random.bossIndex).not.toBe(ordered.bossIndex)
    for (const b of f.rotations) {
      expect(b.rooms).toHaveLength(1)
      expect(b.featured.roomId).toBe(b.rooms[0].roomId)
    }
    const again = (await api.call('/api/raid', { body: feed('player-bbbb') })).data.feed
    expect(again.rotations.map((b: { featured: { roomId: string } }) => b.featured.roomId)).toEqual(f.rotations.map((b: { featured: { roomId: string } }) => b.featured.roomId))
  })

  it('quien entra sin elegir sala va a la del frontal de la rotación ordenada, y la lista lo cuenta', async () => {
    const api = testWorker()
    const front = (await board(api, RaidRotation.Ordered)).featured
    const view = (await api.call('/api/raid', { body: join('player-aaaa', 'a1') })).data.view
    expect(view.roomId).toBe(front.roomId)
    expect((await board(api, RaidRotation.Ordered)).rooms).toMatchObject([{ roomId: front.roomId, players: 1 }])
  })

  it('quien elige una sala de la rotación al azar entra en ella', async () => {
    const api = testWorker()
    const front = (await board(api, RaidRotation.Random)).featured
    const view = (await api.call('/api/raid', { body: { ...join('player-aaaa', 'a1'), targetRoomId: front.roomId } })).data.view
    expect(view.roomId).toBe(front.roomId)
    expect((await board(api, RaidRotation.Random)).rooms).toMatchObject([{ roomId: front.roomId, players: 1 }])
    expect((await board(api, RaidRotation.Ordered)).rooms).toMatchObject([{ players: 0 }])
  })

  it('las salas de las paradas de ruta con jugadores salen aparte, solo para mirar', async () => {
    const api = testWorker()
    await api.call('/api/raid', { body: join('player-aaaa', 'a1', stopChannel()) })
    const { routeRooms } = (await api.call('/api/raid', { body: feed('player-bbbb') })).data.feed
    expect(routeRooms).toMatchObject([{ players: 1, place: { routeId: stopChannel().routeId } }])
  })

  it('una sala de ruta con el jefe ya caído deja de salir en la lista (no se acumulan salas de «1 jugador»)', async () => {
    const api = testWorker()
    const { view } = (await api.call('/api/raid', { body: join('player-aaaa', 'a1', stopChannel()) })).data
    await api.env.DB.prepare("UPDATE rooms SET data = json_set(data, '$.raid.hp', 0) WHERE id = ?").bind(view.roomId).run()
    await api.call('/api/raid', { body: { action: RaidAction.Sync, playerId: 'player-aaaa', nickname: 'A', roomId: view.roomId, mon: mon('a1') } })
    expect((await api.call('/api/raid', { body: feed('player-bbbb') })).data.feed.routeRooms).toEqual([])
  })

  it('la tarea programada borra las salas de ruta sin jugadores que nadie toca en ROOM_MAX_CATCHUP_MS', async () => {
    const api = testWorker()
    const { view } = (await api.call('/api/raid', { body: join('player-aaaa', 'a1', stopChannel()) })).data
    const leave = { action: RaidAction.Sync, playerId: 'player-aaaa', nickname: 'A', roomId: view.roomId, mon: null }
    await api.call('/api/raid', { body: leave })
    const room = () => api.env.DB.prepare('SELECT id FROM rooms WHERE id = ?').bind(view.roomId).first()
    await deleteIdleStopRooms(api.env.DB, Date.now())
    expect(await room()).not.toBeNull()
    await deleteIdleStopRooms(api.env.DB, Date.now() + ROOM_MAX_CATCHUP_MS + 1)
    expect(await room()).toBeNull()
  })

  it('una sala de ruta terminada se borra cuando su último jugador ve cómo acabó', async () => {
    const api = testWorker()
    const { view } = (await api.call('/api/raid', { body: join('player-aaaa', 'a1', stopChannel()) })).data
    await api.env.DB.prepare("UPDATE rooms SET data = json_set(data, '$.raid.hp', 0) WHERE id = ?").bind(view.roomId).run()
    const sync = { action: RaidAction.Sync, playerId: 'player-aaaa', nickname: 'A', roomId: view.roomId, mon: mon('a1') }
    const seen = (await api.call('/api/raid', { body: sync })).data.view
    expect(seen.raid.hp).toBe(0)
    expect(await api.env.DB.prepare('SELECT id FROM rooms WHERE id = ?').bind(view.roomId).first()).toBeNull()
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
