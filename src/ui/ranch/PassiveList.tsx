import type { PassiveLevel } from '../../data/passives'
import type { PokeType } from '../../data/types'
import type { GameState } from '../../game/core/state'
import { passiveThreshold, ranchPassives, ranchTypeCounts } from '../../game/team/ranchPassives'
import { TypeBadge } from '../shared/common'
import { passiveText } from '../shared/passiveText'

/**
 * Pasivas del rancho, una fila por tipo de los Pokémon que viven en él: cuántos hay, cuántos hacen falta para el
 * siguiente nivel y qué da (lo activo resaltado; lo que falta, en gris como objetivo).
 */
export function PassiveList({ game, ranch }: { game: GameState; ranch: number }) {
  const counts = Object.entries(ranchTypeCounts(game, ranch)) as [PokeType, number][]
  const active = new Map(ranchPassives(game, ranch).map((p) => [p.type, p.level]))
  counts.sort((a, b) => (active.get(b[0]) ?? 0) - (active.get(a[0]) ?? 0) || b[1] - a[1])

  if (counts.length === 0) return <p className="small muted">Sin Pokémon en este rancho.</p>
  return (
    <div className="passive-list">
      {counts.map(([type, count]) => {
        const level = active.get(type)
        const next = (level === 2 ? null : level === 1 ? 2 : 1) as PassiveLevel | null
        return (
          <div key={type} className={`passive-row ${level ? 'on' : ''}`}>
            <TypeBadge type={type} />
            <span className="grow small">
              {level ? <strong>Nv. {level}: {passiveText(type, level)}</strong> : <span className="muted">{passiveText(type, 1)}</span>}
              {next && (
                <span className="tiny muted">
                  {' '}
                  · {count}/{passiveThreshold(game, ranch, type, next)} para el nivel {next}
                </span>
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}
