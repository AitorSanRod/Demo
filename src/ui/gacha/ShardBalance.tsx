import type { GameState } from '../../game/core/state'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'

export function ShardBalance({ game }: { game: GameState }) {
  return (
    <div className="card shard-balance">
      <ItemIcon item={ICON.Shard} size={40} />
      <div className="grow">
        <strong>{game.missingnoShards}</strong> <span className="small muted">trozos de MissingNo</span>
      </div>
    </div>
  )
}
