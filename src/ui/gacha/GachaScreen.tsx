import { useState } from 'react'
import type { GameState } from '../../game/core/state'
import { IconTabs, type IconTab } from '../shared/IconTabs'
import { ICON } from '../shared/icons'
import { PokemonSheet } from '../shared/sheet/PokemonSheet'
import { GachaMachine } from './GachaMachine'
import { MissingnoShop } from './MissingnoShop'
import { Shredder } from './Shredder'
import './gacha.css'

type GachaTab = 'pull' | 'shredder' | 'shop'

const TABS: IconTab<GachaTab>[] = [
  { id: 'pull', icon: ICON.Gacha, label: 'Tirar' },
  { id: 'shredder', icon: ICON.Shredder, label: 'Trituradora' },
  { id: 'shop', icon: ICON.Shard, label: 'MissingNo' },
]

/** Pestaña Gacha: tirar, triturar tickets y crearlos con trozos (desde la ficha del Pokémon, como en la Pokédex) */
export function GachaScreen({ game }: { game: GameState }) {
  const [tab, setTab] = useState<GachaTab>('pull')
  const [sheetId, setSheetId] = useState<number | null>(null)

  return (
    <>
      <div className="screen tabbed">
        <IconTabs tabs={TABS} active={tab} onChange={setTab} />
        <div className="tabbed-body">
          <div className="screen scroll">
            {tab === 'pull' && <GachaMachine game={game} />}
            {tab === 'shredder' && <Shredder game={game} />}
            {tab === 'shop' && <MissingnoShop game={game} onOpen={setSheetId} />}
          </div>
        </div>
      </div>
      {/* Fuera de las pestañas, para cubrir toda la zona de contenido como en la Pokédex */}
      {sheetId !== null && <PokemonSheet key={sheetId} game={game} speciesId={sheetId} onClose={() => setSheetId(null)} />}
    </>
  )
}
