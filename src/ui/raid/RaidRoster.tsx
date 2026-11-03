import { BOSS_ID, presentMembers, RaidMemberKind, type Raid, type RaidHit, type RaidMember } from '../../game/raid/raidRoom'
import { Bar, Sprite } from '../shared/common'
import { roundClass } from './roundClass'

/** Los Pokémon de la sala: atacan al jefe cada ronda, reciben sus golpes y, debilitados, esperan a revivir */
export function RaidRoster({ raid, timeScale }: { raid: Raid; timeScale: number }) {
  const bossHits = new Map(raid.lastRound.filter((h) => h.from === BOSS_ID).map((h) => [h.to, h]))
  const attackers = new Set(raid.lastRound.filter((h) => h.to === BOSS_ID).map((h) => h.from))

  return (
    <div className="raid-roster">
      {presentMembers(raid).map((m) => (
        <MemberCard key={m.id} m={m} round={raid.round} hit={bossHits.get(m.id)} attacked={attackers.has(m.id)} timeScale={timeScale} />
      ))}
    </div>
  )
}

interface CardProps {
  m: RaidMember
  round: number
  hit?: RaidHit
  attacked: boolean
  timeScale: number
}

function MemberCard({ m, round, hit, attacked, timeScale }: CardProps) {
  const down = m.downMs > 0
  const reviveSeconds = Math.ceil(m.downMs / 1000 / timeScale)
  const motion = down ? '' : attacked ? roundClass(round, 'lunge') : ''

  return (
    <div className={`raid-member ${down ? 'down' : ''} ${m.kind === RaidMemberKind.Player ? 'mine' : ''}`}>
      <div className={`raid-member-sprite ${motion}`}>
        <Sprite id={m.speciesId} size={52} />
        {hit && hit.dealt > 0 && (
          <span key={round} className="raid-float member">
            −{Math.round(hit.dealt)}
          </span>
        )}
      </div>
      <span className="raid-member-name">{m.trainer}</span>
      <span className="tiny muted">Nv. {m.level}</span>
      {down ? <span className="tiny raid-revive">Vuelve en {reviveSeconds} s</span> : <Bar value={m.hpFraction} max={1} kind="hp" />}
    </div>
  )
}
