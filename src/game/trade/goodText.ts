import { species } from '../../data/species'
import { GoodKind, type TradeAsk, type TradeGood } from './tradeGoods'

// Lo que cambia de manos, en palabras del jugador (anuncios, Notificaciones y avisos push)

const amount = (n: number) => n.toLocaleString('es-ES')

const plural = (n: number, one: string, many: string) => `${amount(n)} ${n === 1 ? one : many}`

export function goodText(good: TradeGood): string {
  if (good.kind === GoodKind.Mon) {
    const stars = good.mon.stars > 0 ? ` ${'★'.repeat(good.mon.stars)}` : ''
    return `${species(good.mon.speciesId).name} Nv. ${good.mon.level}${stars}`
  }
  if (good.kind === GoodKind.Pieces) return `${plural(good.count, 'ticket', 'tickets')} de ${species(good.speciesId).name}`
  if (good.kind === GoodKind.Shards) return plural(good.count, 'trozo de MissingNo', 'trozos de MissingNo')
  if (good.kind === GoodKind.Money) return `${amount(good.count)} ₽`
  return plural(good.count, 'ticket gacha', 'tickets gacha')
}

export function askText(ask: TradeAsk): string {
  if (ask.kind !== GoodKind.Mon) return goodText(ask)
  const names = ask.speciesIds.map((id) => species(id).name)
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} o ${names.at(-1)}`
}
