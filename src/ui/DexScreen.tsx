import { RARITY_INFO, rarityOf, SPECIES } from '../data/species'
import type { GameState } from '../game/state'
import { Sprite } from './common'

export function DexScreen({ game }: { game: GameState }) {
  return (
    <div className="screen scroll">
      <div className="row between">
        <h2 className="section-title">Pokédex</h2>
        <span className="small">
          Capturados <strong>{game.caught.length}</strong>/{SPECIES.length} · Vistos {game.seen.length}
        </span>
      </div>
      <div className="dex-grid">
        {SPECIES.map((sp) => {
          const caught = game.caught.includes(sp.id)
          const seen = caught || game.seen.includes(sp.id)
          return (
            <div
              key={sp.id}
              className={`dex-cell ${caught ? 'caught' : ''}`}
              style={caught ? { ['--rarity' as string]: RARITY_INFO[rarityOf(sp)].color } : undefined}
            >
              <span className="tiny muted">#{String(sp.id).padStart(3, '0')}</span>
              {seen ? (
                <Sprite id={sp.id} size={72} animated={false} silhouette={!caught} />
              ) : (
                <span className="dex-unknown">?</span>
              )}
              <span className="tiny">{seen ? sp.name : '???'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
