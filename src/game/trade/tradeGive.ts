import { isFavorite } from '../collection/dex'
import { piecesOf } from '../collection/pieces'
import { findMon, MonPlace, monPlace, type GameState, type OwnedMon } from '../core/state'
import { GoodKind, type OfferRequest, type TradeAsk, type TradedMon, type TradeGood } from './tradeGoods'

// Lo que sale de la partida al anunciar, al pagar un anuncio o al vender al servidor: solo Pokémon que están en el
// rancho o en la Caja, que no son el compañero ni de una especie favorita, y cantidades que el jugador tiene.

/** Por qué no se puede dar ese Pokémon (anunciarlo, entregarlo o venderlo); null si se puede */
export function giveMonBlocker(s: GameState, uid: string): string | null {
  const mon = findMon(s, uid)
  if (!mon) return 'Ese Pokémon no existe.'
  const place = monPlace(s, uid)
  if (place !== MonPlace.Ranch && place !== MonPlace.Box) return 'Está fuera del rancho.'
  if (uid === s.activeUid) return 'Es tu compañero.'
  if (isFavorite(s, mon.speciesId)) return 'Es favorito: quítale el corazón para darlo.'
  return null
}

/** Los Pokémon que podrían darse (rancho y Caja, sin el compañero), también los favoritos para enseñarlos desactivados */
export function givableMons(s: GameState): OwnedMon[] {
  const atHome = (uid: string) => [MonPlace.Ranch, MonPlace.Box].some((place) => place === monPlace(s, uid))
  return s.owned.filter((m) => m.uid !== s.activeUid && atHome(m.uid))
}

export const tradedMon = (m: OwnedMon): TradedMon => ({ speciesId: m.speciesId, level: m.level, exp: m.exp, stars: m.stars })

/** Quita el Pokémon de la partida si se puede dar y devuelve cómo viaja */
export function takeMon(s: GameState, uid: string): TradedMon | null {
  if (giveMonBlocker(s, uid)) return null
  const mon = findMon(s, uid)!
  s.owned = s.owned.filter((m) => m.uid !== uid)
  return tradedMon(mon)
}

/** Por qué no se pueden dar esos tickets de la especie (los de las favoritas quedan protegidos, como al triturar) */
export function givePiecesBlocker(s: GameState, speciesId: number, count: number): string | null {
  if (isFavorite(s, speciesId)) return 'Es favorito: quítale el corazón para darlos.'
  return count >= 1 && piecesOf(s, speciesId) >= count ? null : 'No tienes tantos tickets.'
}

/** Quita lo anunciado de la partida y lo devuelve tal y como viaja; null si no se puede (y no quita nada) */
export function takeOffer(s: GameState, offer: OfferRequest): TradeGood | null {
  if (offer.kind === GoodKind.Mon) {
    const mon = takeMon(s, offer.uid)
    return mon && { kind: GoodKind.Mon, mon }
  }
  if (offer.kind === GoodKind.Pieces) {
    if (givePiecesBlocker(s, offer.speciesId, offer.count)) return null
    s.pieces[offer.speciesId] -= offer.count
    return { ...offer }
  }
  if (s.missingnoShards < offer.count) return null
  s.missingnoShards -= offer.count
  return { ...offer }
}

/** Por qué no se puede pagar lo pedido (con el Pokémon `uid` si se pide uno); null si se puede */
export function payBlocker(s: GameState, ask: TradeAsk, uid: string | null): string | null {
  if (ask.kind === GoodKind.Mon) {
    const mon = uid ? findMon(s, uid) : undefined
    if (!mon || !ask.speciesIds.includes(mon.speciesId)) return 'Elige uno de los Pokémon que se piden.'
    return giveMonBlocker(s, mon.uid)
  }
  const has = ask.kind === GoodKind.Money ? s.money : ask.kind === GoodKind.Shards ? s.missingnoShards : s.tickets
  return has >= ask.count ? null : 'No tienes suficiente.'
}

/** Los Pokémon de las especies pedidas que hay en el rancho o la Caja (también los favoritos, para enseñarlos apagados) */
export const payOptions = (s: GameState, ask: TradeAsk): OwnedMon[] =>
  ask.kind === GoodKind.Mon ? givableMons(s).filter((m) => ask.speciesIds.includes(m.speciesId)) : []

/** Si se puede pagar lo pedido con algo de lo que hay */
export const canPay = (s: GameState, ask: TradeAsk): boolean =>
  ask.kind === GoodKind.Mon ? payOptions(s, ask).some((m) => !giveMonBlocker(s, m.uid)) : !payBlocker(s, ask, null)

/** Quita de la partida el pago de un anuncio y lo devuelve tal y como viaja; null si no se puede pagar */
export function payAsk(s: GameState, ask: TradeAsk, uid: string | null): TradeGood | null {
  if (payBlocker(s, ask, uid)) return null
  if (ask.kind === GoodKind.Mon) return { kind: GoodKind.Mon, mon: takeMon(s, uid!)! }
  if (ask.kind === GoodKind.Money) s.money -= ask.count
  else if (ask.kind === GoodKind.Shards) s.missingnoShards -= ask.count
  else s.tickets -= ask.count
  return { kind: ask.kind, count: ask.count }
}
