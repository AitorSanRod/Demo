import { authRoute } from './auth/routes'
import type { Env } from './env'
import { json } from './http'
import { raidRoute } from './raid'
import { saveRoute } from './save'

// El Worker de Pokérancho. La web (dist/) la sirve Cloudflare sin pasar por aquí (ver run_worker_first en
// wrangler.jsonc); aquí solo llega /api/*.

const AUTH_PREFIX = '/api/auth/'

export default {
  async fetch(request, env): Promise<Response> {
    const { pathname } = new URL(request.url)
    if (pathname === '/api/raid') return raidRoute(request, env)
    if (pathname === '/api/save') return saveRoute(request, env)
    if (pathname.startsWith(AUTH_PREFIX)) return authRoute(request, env, pathname.slice(AUTH_PREFIX.length))
    return json({ error: 'No existe' }, 404)
  },
} satisfies ExportedHandler<Env>
