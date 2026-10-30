import { useState } from 'react'
import type { GameState } from '../../game/core/state'
import { DiscoverPanel } from './DiscoverPanel'
import { GachaMachine } from './GachaMachine'
import { MissingnoShop } from './MissingnoShop'
import { Shredder } from './Shredder'
import './gacha.css'

type GachaTab = 'pull' | 'shredder' | 'shop' | 'discover'

const TABS: { id: GachaTab; label: string }[] = [
  { id: 'pull', label: '🎰 Tirar' },
  { id: 'shredder', label: '⚙️ Trituradora' },
  { id: 'shop', label: '👾 MissingNo' },
  { id: 'discover', label: '🔍 Descubrir' },
]

export function GachaScreen({ game }: { game: GameState }) {
  const [tab, setTab] = useState<GachaTab>('pull')

  return (
    <div className="screen scroll">
      <div className="segmented">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'pull' && <GachaMachine game={game} />}
      {tab === 'shredder' && <Shredder game={game} />}
      {tab === 'shop' && <MissingnoShop game={game} />}
      {tab === 'discover' && <DiscoverPanel game={game} />}
    </div>
  )
}
