import { useState, type ReactNode } from 'react'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { collectRaidPrizes } from '../../game/raid/raidPrizes'
import { raidPrizeRewards } from '../shared/rewardItems'
import { RewardOverlay, type RewardItem } from '../shared/RewardOverlay'

// Premios de los jefes de Raids derrotados, pendientes de recoger: se recogen en la pestaña Raids (RaidPrizeBanner) o
// desde el Menú del rancho, y los dos sitios enseñan lo mismo al recogerlos.

/** Recoger los premios pendientes: `collect` los suma a la partida y `overlay` es la pantalla que los enseña */
export function useRaidPrizeCollect(): { collect: () => void; overlay: ReactNode } {
  const [report, setReport] = useState<RewardItem[] | null>(null)
  const collect = () => setReport(raidPrizeRewards(act(collectRaidPrizes)))
  const overlay = report && <RewardOverlay title={report.length > 1 ? '¡Premios del jefe!' : '¡Premio del jefe!'} items={report} onClose={() => setReport(null)} />
  return { collect, overlay }
}

/** Lo que traen los premios pendientes, para leerlo: «2 jefes · ₽ 460 · 2 tickets» */
export function pendingPrizesText(game: GameState): string {
  const prizes = game.raidPrizes
  const money = prizes.reduce((sum, p) => sum + p.money, 0)
  const tickets = prizes.reduce((sum, p) => sum + p.tickets + p.pieces, 0)
  const parts = [`${prizes.length} ${prizes.length === 1 ? 'jefe' : 'jefes'}`, money > 0 && `₽ ${money}`, tickets > 0 && `${tickets} ticket${tickets > 1 ? 's' : ''}`]
  return parts.filter(Boolean).join(' · ')
}
