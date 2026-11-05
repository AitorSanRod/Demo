import { RARITY_INFO } from '../../data/species'
import { Foldout } from '../shared/Foldout'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { RARITIES, RARITY_TITLE } from './rarityTitles'

/** Probabilidad de cada rareza por ticket, en un desplegable cerrado bajo la máquina */
export function GachaRates() {
  return (
    <Foldout
      kicker="Gacha"
      title="Probabilidades"
      className="gacha-rates-fold"
      art={<ItemIcon item={ICON.Gacha} size={110} className="foldout-art" />}
      defaultOpen={false}
    >
      <div className="gacha-rates">
        {RARITIES.map((r) => (
          <div key={r} className="card gacha-rate" style={{ ['--rarity' as string]: RARITY_INFO[r].color }}>
            <strong>{(RARITY_INFO[r].rate * 100).toFixed(0)}%</strong>
            <span className="small">{RARITY_TITLE[r]}</span>
          </div>
        ))}
      </div>
    </Foldout>
  )
}
