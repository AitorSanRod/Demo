import { useState } from 'react'
import type { Item } from '../../data/items'
import type { GameState } from '../../game/core/state'
import { GachaMachine } from './GachaMachine'
import { MissingnoShop } from './MissingnoShop'
import { Shredder } from './Shredder'
import './gacha.css'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'

type GachaTab = 'pull' | 'shredder' | 'shop'

const TABS: { id: GachaTab; icon: Item; label: string }[] = [
  { id: 'pull', icon: ICON.Gacha, label: 'Tirar' },
  { id: 'shredder', icon: ICON.Shredder, label: 'Trituradora' },
  { id: 'shop', icon: ICON.Shard, label: 'MissingNo' },
]

export function GachaScreen({ game }: { game: GameState }) {
  const [tab, setTab] = useState<GachaTab>('pull')

  return (
    <div className="screen scroll">
      <div className="segmented">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            <ItemIcon item={t.icon} size={20} /> {t.label}
          </button>
        ))}
      </div>
      {tab === 'pull' && <GachaMachine game={game} />}
      {tab === 'shredder' && <Shredder game={game} />}
      {tab === 'shop' && <MissingnoShop game={game} />}
    </div>
  )
}
