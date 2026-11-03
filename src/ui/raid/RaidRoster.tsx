import { presentMembers, RaidMemberKind, type Raid, type RaidMember } from '../../game/raid/raidRoom'
import { Bar, Sprite } from '../shared/common'
import './raid.css'

/** Quién hay en la sala: entrenador, nivel y PS de cada uno (la pelea se ve arriba, en RaidBattleScene) */
export function RaidRoster({ raid, timeScale }: { raid: Raid; timeScale: number }) {
  return (
    <div className="raid-roster">
      {presentMembers(raid).map((m) => (
        <MemberCard key={m.id} m={m} timeScale={timeScale} />
      ))}
    </div>
  )
}

function MemberCard({ m, timeScale }: { m: RaidMember; timeScale: number }) {
  const down = m.downMs > 0
  return (
    <div className={`raid-member ${down ? 'down' : ''} ${m.kind === RaidMemberKind.Player ? 'mine' : ''}`}>
      <div className="raid-member-sprite">
        <Sprite id={m.speciesId} size={44} animated={false} />
      </div>
      <span className="raid-member-name">{m.trainer}</span>
      <span className="tiny muted">Nv. {m.level}</span>
      {down ? <span className="tiny raid-revive">Vuelve en {Math.ceil(m.downMs / 1000 / timeScale)} s</span> : <Bar value={m.hpFraction} max={1} kind="hp" />}
    </div>
  )
}
