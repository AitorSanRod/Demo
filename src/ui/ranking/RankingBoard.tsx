import type { ReactNode } from 'react'
import { nextRankingAt } from '../../game/core/ranking'

/** Hora en reloj (HH:MM) */
const clock = (ms: number) => new Date(ms).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

/** Lo que tienen en común los rankings (dinero, daño): `S` es el puesto y lo que se puntúa */
export interface BoardView<S extends { rank: number }> {
  top: (S & { nickname: string; mine: boolean })[]
  mine: S | null
  total: number
  builtAt: number | null
}

interface BoardProps<S extends { rank: number }> {
  view: BoardView<S>
  /** La puntuación, a la derecha */
  score: (s: S) => string
  /** Lo que va bajo el nombre (el Pokémon que más daño ha hecho) */
  detail?: (s: S) => ReactNode
}

/** Tu puesto arriba y la lista de los primeros, con tu línea marcada si estás entre ellos */
export function RankingBoard<S extends { rank: number }>({ view, score, detail }: BoardProps<S>) {
  return (
    <>
      <div className="ranking-mine">
        {view.mine ? (
          <>
            <span className="ranking-mine-rank">#{view.mine.rank}</span>
            <span className="grow">
              <strong>Tu puesto</strong>
              <span className="tiny muted ranking-sub">de {view.total} entrenadores</span>
              {detail?.(view.mine)}
            </span>
            <strong>{score(view.mine)}</strong>
          </>
        ) : (
          <span className="small">
            Aún no estás en el ranking: entrarás en la próxima actualización{view.builtAt !== null && `, a las ${clock(nextRankingAt(view.builtAt))}`}.
          </span>
        )}
      </div>
      {view.top.length === 0 ? (
        <p className="small muted">Todavía no hay nadie en el ranking.</p>
      ) : (
        <ol className="ranking-list">
          {view.top.map((e) => (
            <li key={`${e.rank}-${e.nickname}`} className={`ranking-row${e.mine ? ' mine' : ''}`}>
              <RankBadge rank={e.rank} />
              <span className="grow ranking-name">
                {e.nickname}
                {detail?.(e)}
              </span>
              <span className="small">{score(e)}</span>
            </li>
          ))}
        </ol>
      )}
      {view.builtAt !== null && <p className="tiny muted ranking-updated">Actualizado a las {clock(view.builtAt)} · el siguiente, a las {clock(nextRankingAt(view.builtAt))}</p>}
    </>
  )
}

/** Clase de los tres primeros puestos (oro, plata, bronce) */
const PODIUM = ['gold', 'silver', 'bronze']

function RankBadge({ rank }: { rank: number }) {
  const podium = PODIUM[rank - 1]
  return <span className={`ranking-rank${podium ? ` ${podium}` : ''}`}>{rank}</span>
}
