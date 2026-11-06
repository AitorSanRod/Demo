import { useState, type ReactNode } from 'react'
import { species } from '../../data/species'
import { act, getState } from '../../game/core/store'
import { collectRaidPrize, collectRaidPrizes } from '../../game/raid/raidPrizes'
import { goodText } from '../../game/trade/goodText'
import { TradeAction, type InboxEntry } from '../../game/trade/tradeProtocol'
import { receiveBlocker } from '../../game/trade/tradeReceive'
import { claimDailyGift } from '../../net/dailyGift'
import { tradeOp } from '../../net/tradeApi'
import { refreshTradeBoard } from '../../net/tradeBoard'
import { giftRewards, raidPrizeRewards } from '../shared/rewardItems'
import { RewardOverlay, type RewardItem } from '../shared/RewardOverlay'

// Recoger lo de Notificaciones: el obsequio diario, cada premio de raid, cada cosa de los intercambios o todo a la vez.
// Obsequio y premios se enseñan en la pantalla de premios; lo de los intercambios, en un aviso de texto.

interface Report {
  title: string
  items: RewardItem[]
}

/** Lo que dice el aviso al recoger algo de un intercambio (o por qué no se ha podido) */
async function claimTrade(entry: InboxEntry): Promise<string> {
  const outcome = await tradeOp({ action: TradeAction.Claim, inboxId: entry.id })
  if ('error' in outcome) return outcome.error
  const refund = outcome.result.duplicate
  if (!refund) return `Recogido: ${goodText(entry.good)}.`
  return `Ya tenías a ${species(refund.speciesId).name}: recibes ${refund.pieces} tickets suyos y ${refund.money.toLocaleString('es-ES')} ₽.`
}

export function useInboxCollect() {
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [report, setReport] = useState<Report | null>(null)

  /** Una recogida a la vez; `key` dice qué fila está recogiendo */
  async function exclusive(key: string, run: () => Promise<void>) {
    if (busy) return
    setBusy(key)
    try {
      await run()
    } finally {
      setBusy(null)
    }
  }

  const collectGift = () =>
    exclusive('gift', async () => {
      const gift = await claimDailyGift()
      if (gift) setReport({ title: '¡Obsequio diario!', items: giftRewards(gift) })
    })

  const collectPrize = (index: number) =>
    exclusive(`prize:${index}`, async () => {
      const prize = act((s) => collectRaidPrize(s, index))
      if (prize) setReport({ title: '¡Premio del jefe!', items: raidPrizeRewards([prize]) })
    })

  const collectTrade = (entry: InboxEntry) =>
    exclusive(entry.id, async () => {
      setNotice(await claimTrade(entry))
      await refreshTradeBoard()
    })

  /** Todo lo que se pueda: lo de un intercambio que aún no cabe (un Pokémon sin sitio) se queda */
  const collectAll = (giftReady: boolean, entries: InboxEntry[]) =>
    exclusive('all', async () => {
      const gift = giftReady ? await claimDailyGift() : null
      const prizes = act(collectRaidPrizes)
      const notes: string[] = []
      // Se mira con la partida de cada momento: cada Pokémon recogido ocupa sitio
      for (const entry of entries) if (!receiveBlocker(getState(), entry.good)) notes.push(await claimTrade(entry))
      if (entries.length) await refreshTradeBoard()
      const items = [...(gift ? giftRewards(gift) : []), ...(prizes.length ? raidPrizeRewards(prizes) : [])]
      if (items.length) setReport({ title: '¡Todo recogido!', items })
      setNotice(notes.length ? notes.join(' ') : null)
    })

  const overlay: ReactNode = report && <RewardOverlay title={report.title} items={report.items} onClose={() => setReport(null)} />
  return { busy, notice, overlay, collectGift, collectPrize, collectTrade, collectAll }
}
