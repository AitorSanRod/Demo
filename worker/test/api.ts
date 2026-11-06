import type { Env } from '../env'
import worker from '../index'
import { fakeD1 } from './fakeD1'

// Un Worker de pruebas con su propia base de datos (o la de otro, para tener dos jugadores) y un navegador que guarda la
// cookie de sesión como el de verdad

const ORIGIN = 'https://pokerancho.test'

export function testWorker(env: Env = { ASSETS: { fetch: async () => new Response('web') } as unknown as Fetcher, DB: fakeD1() }) {
  let cookie = ''

  async function call(path: string, init: { method?: string; body?: unknown; origin?: string | null } = {}) {
    const method = init.method ?? (init.body === undefined ? 'GET' : 'POST')
    const headers = new Headers({ 'Content-Type': 'application/json' })
    if (init.origin !== null && method !== 'GET') headers.set('Origin', init.origin ?? ORIGIN)
    if (cookie) headers.set('Cookie', cookie)
    const body = init.body === undefined ? undefined : JSON.stringify(init.body)
    const res = await worker.fetch(new Request(ORIGIN + path, { method, headers, body }), env)
    const setCookie = res.headers.get('Set-Cookie')
    if (setCookie) cookie = setCookie.split(';')[0].endsWith('=') ? '' : setCookie.split(';')[0]
    return { status: res.status, data: (await res.json()) as Record<string, any> }
  }

  return { env, call, signedIn: () => cookie !== '' }
}
