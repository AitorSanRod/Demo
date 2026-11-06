import { AuthCode } from '../src/game/core/accountRules'
import { isSpeciesId } from '../src/game/trade/tradeGoods'
import { MAX_SEARCH_SPECIES, parseTradeRequest, TradeAction, TradeCode, type TradeBoard, type TradeListing } from '../src/game/trade/tradeProtocol'
import { sessionUser } from './auth/session'
import { boardListings, expireListings, myListings, pendingInbox, type StoredListing } from './db/trades'
import type { Env } from './env'
import { json, readJson, sameOrigin } from './http'
import { acceptListing, claimEntry, listOffer, withdrawOffer } from './tradeActions'

// /api/trade: los intercambios entre jugadores, solo con cuenta. GET da el tablón (con ?species=1,4,7, solo los
// anuncios que ofrecen o piden alguna de esas especies); POST anuncia, acepta, retira o recoge (ver tradeActions.ts).
// Antes de cada petición vuelven a su dueño los anuncios caducados (también lo hace la tarea programada).

/** Bytes como mucho de una petición */
const MAX_REQUEST_BYTES = 4096

/** El anuncio sin el id de su vendedor, que la web no necesita */
const publicListing = ({ sellerId: _seller, ...listing }: StoredListing): TradeListing => listing

function searchedSpecies(url: URL): number[] {
  const raw = url.searchParams.get('species')
  if (!raw) return []
  return [...new Set(raw.split(',').map(Number).filter(isSpeciesId))].slice(0, MAX_SEARCH_SPECIES)
}

async function board(db: D1Database, userId: string, url: URL, now: number): Promise<TradeBoard> {
  const [listings, mine, inbox] = await Promise.all([boardListings(db, userId, now, searchedSpecies(url)), myListings(db, userId, now), pendingInbox(db, userId)])
  return { listings: listings.map(publicListing), mine: mine.map(publicListing), inbox, serverNow: now }
}

export async function tradeRoute(request: Request, env: Env): Promise<Response> {
  const now = Date.now()
  const user = await sessionUser(env.DB, request, now)
  if (!user) return json({ code: AuthCode.SignedOut }, 401)
  await expireListings(env.DB, now)
  if (request.method === 'GET') return json(await board(env.DB, user.id, new URL(request.url), now))
  if (request.method !== 'POST') return json({ error: 'Solo GET o POST' }, 405)
  if (!sameOrigin(request)) return json({ code: AuthCode.WrongOrigin }, 403)
  const req = parseTradeRequest(await readJson(request, MAX_REQUEST_BYTES))
  if (!req) return json({ code: TradeCode.Invalid }, 400)
  if (req.action === TradeAction.List) return listOffer(env.DB, user.id, req, now)
  if (req.action === TradeAction.Accept) return acceptListing(env.DB, user.id, req, now)
  if (req.action === TradeAction.Claim) return claimEntry(env.DB, user.id, req, now)
  return withdrawOffer(env.DB, user.id, req, now)
}
