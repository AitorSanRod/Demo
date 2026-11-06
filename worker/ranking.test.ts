import { afterEach, describe, expect, it, vi } from 'vitest'
import { STARTERS } from '../src/data/species'
import { cloudUpload } from '../src/game/core/cloudSave'
import { RANKING_ACTIVE_MS, RANKING_REFRESH_MS, RANKING_SIZE, RankingCode } from '../src/game/core/ranking'
import { initialState } from '../src/game/core/state'
import { chooseStarter } from '../src/game/core/test-utils'
import { MailKind, sendMail } from './mail'
import { refreshRanking } from './ranking'
import { testWorker } from './test/api'

vi.mock('./mail', async (original) => ({ ...(await original<typeof import('./mail')>()), sendMail: vi.fn() }))
vi.mock('../src/data/maps/kantoMaps', () => import('../src/game/core/test-map'))

type Api = ReturnType<typeof testWorker>

/** Un jugador con cuenta en la base de datos de `env` (nueva si no se da), con apodo si se pide */
async function player(email: string, nickname: string | null, env?: Api['env']): Promise<Api> {
  const api = testWorker(env)
  await api.call('/api/auth/signup', { body: { email, password: 'pikachu1234' } })
  const token = vi.mocked(sendMail).mock.calls.filter((c) => c[2] === MailKind.Confirm).at(-1)![3].split('=')[1]
  await api.call('/api/auth/confirm', { body: { token } })
  if (nickname) await api.call('/api/auth/nickname', { body: { nickname } })
  return api
}

async function upload(api: Api, money: number) {
  const s = initialState()
  chooseStarter(s, STARTERS[0])
  s.money = money
  await api.call('/api/save', { body: { baseRevision: null, ...cloudUpload(s) } })
}

const refresh = (api: Api) => refreshRanking(api.env.DB, Date.now())

afterEach(() => vi.useRealTimers())

describe('ranking de dinero', () => {
  it('ordena por dinero y marca tu puesto', async () => {
    const ash = await player('ash@paleta.es', 'Ash')
    const gary = await player('gary@paleta.es', 'Gary', ash.env)
    await upload(ash, 100)
    await upload(gary, 300)
    await refresh(ash)
    const { ranking } = (await ash.call('/api/ranking')).data
    expect(ranking.top.map((e: { nickname: string }) => e.nickname)).toEqual(['Gary', 'Ash'])
    expect(ranking.top[1]).toMatchObject({ rank: 2, mine: true })
    expect(ranking.mine).toEqual({ rank: 2, money: 100 })
    expect(ranking.total).toBe(2)
  })

  it(`la lista tiene como mucho ${RANKING_SIZE} y tu puesto llega aunque estés por debajo`, async () => {
    const first = await player('p0@ranking.es', 'P0')
    await upload(first, 0)
    for (let i = 1; i <= RANKING_SIZE; i++) await upload(await player(`p${i}@ranking.es`, `P${i}`, first.env), i + 1)
    await refresh(first)
    const { ranking } = (await first.call('/api/ranking')).data
    expect(ranking.top).toHaveLength(RANKING_SIZE)
    expect(ranking.mine.rank).toBe(RANKING_SIZE + 1)
  })

  it('sin apodo, o tras ocultarse, ni se aparece ni se ve', async () => {
    const ash = await player('ash@paleta.es', 'Ash')
    const anon = await player('anon@paleta.es', null, ash.env)
    await upload(ash, 100)
    await upload(anon, 500)
    expect((await anon.call('/api/ranking')).data.code).toBe(RankingCode.NoNickname)
    expect((await ash.call('/api/auth/ranked', { body: { ranked: false } })).data.user.ranked).toBe(false)
    await refresh(ash)
    expect((await ash.call('/api/ranking')).data.code).toBe(RankingCode.Hidden)
    await ash.call('/api/auth/ranked', { body: { ranked: true } })
    expect((await ash.call('/api/ranking')).data.ranking.total).toBe(0)
  })

  it('quien lleva tiempo sin subir la partida sale del ranking', async () => {
    const ash = await player('ash@paleta.es', 'Ash')
    await upload(ash, 100)
    vi.useFakeTimers({ now: Date.now() + RANKING_ACTIVE_MS + RANKING_REFRESH_MS, toFake: ['Date'] })
    await refresh(ash)
    expect((await ash.call('/api/ranking')).data.ranking).toMatchObject({ mine: null, total: 0 })
  })

  it('sin sesión no hay ranking', async () => {
    expect((await testWorker().call('/api/ranking')).status).toBe(401)
  })
})
