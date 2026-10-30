import type { GameState } from '../../game/core/state'

export function ShardBalance({ game }: { game: GameState }) {
  return (
    <div className="card shard-balance">
      <span className="shard-icon">👾</span>
      <div className="grow">
        <strong>{game.missingnoShards}</strong> <span className="small muted">trozos de MissingNo</span>
      </div>
    </div>
  )
}
