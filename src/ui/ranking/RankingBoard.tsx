import { nextRankingAt, type RankingEntry, type RankingView } from '../../game/core/ranking'

/** Hora en reloj (HH:MM) */
const clock = (ms: number) => new Date(ms).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

const money = (n: number) => `₽ ${n.toLocaleString('es-ES')}`

/** Tu puesto arriba y la lista de los primeros, con tu línea marcada si estás entre ellos */
export function RankingBoard({ view }: { view: RankingView }) {
  return (
    <>
      <div className="ranking-mine">
        {view.mine ? (
          <>
            <span className="ranking-mine-rank">#{view.mine.rank}</span>
            <span className="grow">
              <strong>Tu puesto</strong>
              <span className="tiny muted ranking-sub">de {view.total} entrenadores</span>
            </span>
            <strong>{money(view.mine.money)}</strong>
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
            <RankingRow key={`${e.rank}-${e.nickname}`} entry={e} />
          ))}
        </ol>
      )}
      {view.builtAt !== null && <p className="tiny muted ranking-updated">Actualizado a las {clock(view.builtAt)} · el siguiente, a las {clock(nextRankingAt(view.builtAt))}</p>}
    </>
  )
}

/** Clase de los tres primeros puestos (oro, plata, bronce) */
const PODIUM = ['gold', 'silver', 'bronze']

function RankingRow({ entry }: { entry: RankingEntry }) {
  const podium = PODIUM[entry.rank - 1]
  return (
    <li className={`ranking-row${entry.mine ? ' mine' : ''}`}>
      <span className={`ranking-rank${podium ? ` ${podium}` : ''}`}>{entry.rank}</span>
      <span className="grow ranking-name">{entry.nickname}</span>
      <span className="small">{money(entry.money)}</span>
    </li>
  )
}
