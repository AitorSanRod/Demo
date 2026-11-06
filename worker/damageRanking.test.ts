import { describe, expect, it, vi } from 'vitest'
import { player as anonymousId, snap, tabRoom } from '../src/game/raid/online/online-test-utils'
import { seatPlayer, type SharedRoom } from '../src/game/raid/online/sharedRoom'
import { RaidMemberKind } from '../src/game/raid/raidRoom'
import { saveRoom } from './db/rooms'
import { refreshRanking } from './ranking'
import { accountId, player, type Api } from './test/accounts'

vi.mock('./mail', async (original) => ({ ...(await original<typeof import('./mail')>()), sendMail: vi.fn() }))
vi.mock('../src/data/maps/kantoMaps', () => import('../src/game/core/test-map'))

/** Un Pokémon de un jugador en una sala y el daño que hace */
interface Fighter {
  playerId: string
  uid: string
  damage: number
}

/** Una sala de la pestaña Raids en la que los `fighters` hacen su daño; con `fell`, el jefe cae */
function room(fighters: Fighter[], fell = true): SharedRoom {
  const r = tabRoom()
  for (const f of fighters) {
    seatPlayer(r, f.playerId, 'Nadie', snap(f.uid))
    r.raid.members.find((m) => m.kind === RaidMemberKind.Player && m.left === false && m.damage === 0)!.damage = f.damage
  }
  if (fell) r.raid.hp = 0
  return r
}

const save = (api: Api, r: SharedRoom) => saveRoom(api.env.DB, { room: r, version: null })

const damageRanking = async (api: Api) => {
  await refreshRanking(api.env.DB, Date.now())
  return (await api.call('/api/ranking')).data.damage
}

describe('ranking de daño a los jefes', () => {
  it('suma el daño de cada pelea terminada y elige el Pokémon que más ha hecho', async () => {
    const ash = await player('ash@paleta.es', 'Ash')
    const gary = await player('gary@paleta.es', 'Gary', ash.env)
    const [ashId, garyId] = [await accountId(ash), await accountId(gary)]
    await save(ash, room([{ playerId: ashId, uid: 'pika', damage: 30 }, { playerId: garyId, uid: 'eevee', damage: 50 }]))
    await save(ash, room([{ playerId: ashId, uid: 'pika', damage: 30 }]))
    await save(ash, room([{ playerId: ashId, uid: 'bulba', damage: 10 }]))
    await save(ash, room([{ playerId: ashId, uid: 'bulba', damage: 500 }], false))

    const damage = await damageRanking(ash)
    expect(damage.top.map((e: { nickname: string }) => e.nickname)).toEqual(['Ash', 'Gary'])
    expect(damage.mine).toEqual({ rank: 1, damage: 70, topMon: { speciesId: snap('pika').speciesId, damage: 60 } })
    expect(damage.top[1]).toMatchObject({ rank: 2, damage: 50, mine: false })
    expect(damage.total).toBe(2)
  })

  it('una sala guardada otra vez después de terminar no vuelve a contar', async () => {
    const ash = await player('ash@paleta.es', 'Ash')
    const fought = room([{ playerId: await accountId(ash), uid: 'pika', damage: 30 }])
    await save(ash, fought)
    await saveRoom(ash.env.DB, { room: fought, version: 1 })
    expect((await damageRanking(ash)).mine.damage).toBe(30)
  })

  it('el daño de quien juega sin cuenta no se apunta', async () => {
    const ash = await player('ash@paleta.es', 'Ash')
    await save(ash, room([{ playerId: anonymousId(1), uid: 'pika', damage: 30 }]))
    expect((await damageRanking(ash)).total).toBe(0)
  })

  it('quien se oculta del ranking tampoco sale en el de daño', async () => {
    const ash = await player('ash@paleta.es', 'Ash')
    await save(ash, room([{ playerId: await accountId(ash), uid: 'pika', damage: 30 }]))
    await ash.call('/api/auth/ranked', { body: { ranked: false } })
    await refreshRanking(ash.env.DB, Date.now())
    await ash.call('/api/auth/ranked', { body: { ranked: true } })
    expect((await ash.call('/api/ranking')).data.damage).toMatchObject({ mine: null, total: 0 })
  })
})
