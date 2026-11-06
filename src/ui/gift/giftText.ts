import type { DailyGift } from '../../data/dailyGifts'

/** Lo que trae el obsequio, para leerlo: «2000 ₽, 50 trozos de MissingNo y 1 ticket» */
export function giftText(gift: DailyGift): string {
  const parts = [
    gift.money > 0 && `${gift.money} ₽`,
    gift.missingnoShards > 0 && `${gift.missingnoShards} trozos de MissingNo`,
    gift.tickets > 0 && `${gift.tickets} ticket${gift.tickets > 1 ? 's' : ''}`,
  ].filter((p): p is string => !!p)
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} y ${parts.at(-1)}` : (parts[0] ?? '')
}
