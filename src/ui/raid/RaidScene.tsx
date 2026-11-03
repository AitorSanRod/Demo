import { route } from '../../data/maps'
import { species } from '../../data/species'
import { BOSS_ID, type Raid } from '../../game/raid/raidRoom'
import { Bar, Sprite } from '../shared/common'
import { formatMinutes } from '../shared/format'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { HeroLayout } from '../shared/sheet/HeroLayout'
import { TYPE_SCENERY } from '../shared/sheet/scenery'
import { roundClass } from './roundClass'

/**
 * Cabecera del jefe: su paisaje, dónde vive, el jefe en grande con el daño de la última ronda, la vida que le queda
 * y cuánto tardará en caer al ritmo de la sala (`minutesLeft`, en minutos reales; null si nadie le hace daño)
 */
export function RaidScene({ raid, minutesLeft }: { raid: Raid; minutesLeft: number | null }) {
  const sp = species(raid.boss.speciesId)
  const dealt = raid.lastRound.filter((h) => h.to === BOSS_ID).reduce((sum, h) => sum + h.dealt, 0)
  const percent = Math.ceil((raid.hp / raid.maxHp) * 100)

  return (
    <HeroLayout
      scenery={TYPE_SCENERY[sp.types[0]]}
      name={sp.name}
      subtitle={
        <>
          <ItemIcon item={ICON.Raid} size={22} /> Jefe comunitario · Nv. {raid.boss.level}
          {raid.boss.routeId && ` · ${route(raid.boss.routeId).name}`}
        </>
      }
      footer={
        <div className="raid-boss-hp">
          <Bar value={raid.hp} max={raid.maxHp} kind="hp" />
          <span className="small">
            {percent}% · {raid.hp} / {raid.maxHp} PS
          </span>
          <span className="small raid-eta">
            {minutesLeft === null ? 'Nadie le está haciendo daño' : `Caerá en ≈ ${formatMinutes(minutesLeft)} al ritmo de la sala`}
          </span>
        </div>
      }
    >
      <div className={`raid-boss ${dealt > 0 ? roundClass(raid.round, 'shake') : ''}`}>
        <Sprite id={sp.id} size={180} />
      </div>
      {dealt > 0 && (
        <span key={raid.round} className="raid-float boss">
          −{dealt}
        </span>
      )}
    </HeroLayout>
  )
}
