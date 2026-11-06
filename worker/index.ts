import { authRoute } from './auth/routes'
import { giftRoute } from './gift'
import { pushRoute } from './push/routes'
import { scheduled } from './scheduled'
import type { Env } from './env'
import { json } from './http'
import { raidRoute } from './raid'
import { saveRoute } from './save'
import { tradeRoute } from './trade'

// El Worker de Pokérancho. La web (dist/) la sirve Cloudflare sin pasar por aquí (ver run_worker_first en
// wrangler.jsonc); aquí solo llega /api/* y, cada minuto, la tarea programada.

const AUTH_PREFIX = '/api/auth/'
const PUSH_PREFIX = '/api/push/'

export default {
  async fetch(request, env): Promise<Response> {
    const { pathname } = new URL(request.url)
    if (pathname === '/api/raid') return raidRoute(request, env)
    if (pathname === '/api/save') return saveRoute(request, env)
    if (pathname === '/api/gift') return giftRoute(request, env)
    if (pathname === '/api/trade') return tradeRoute(request, env)
    if (pathname.startsWith(AUTH_PREFIX)) return authRoute(request, env, pathname.slice(AUTH_PREFIX.length))
    if (pathname.startsWith(PUSH_PREFIX)) return pushRoute(request, env, pathname.slice(PUSH_PREFIX.length))
    return json({ error: 'No existe' }, 404)
  },
  // Tarea programada de cada minuto: raids sin nadie mirando, anuncios caducados y avisos push
  async scheduled(_controller, env) {
    await scheduled(env)
  },
} satisfies ExportedHandler<Env>
