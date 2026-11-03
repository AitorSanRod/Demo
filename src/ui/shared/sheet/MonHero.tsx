import { useEffect, useRef, useState } from 'react'
import { species } from '../../../data/species'
import type { OwnedMon } from '../../../game/core/state'
import type { TrainPlan } from '../../../game/team/ranch'
import { expToNext, maxHp } from '../../../game/team/stats'
import { Bar, Sprite } from '../common'
import { ExpArc, HeroLayout } from './HeroLayout'
import { LevelUpBurst } from './LevelUpBurst'
import { TYPE_SCENERY } from './scenery'
import { useAnimatedExp } from './useAnimatedExp'

const LEVEL_UP_JUMP: Keyframe[] = [{ transform: 'none' }, { transform: 'translateY(-18px) scale(1.06)', offset: 0.4 }, { transform: 'none' }]

/**
 * Cabecera de la ficha de un Pokémon del equipo: nivel y ★, el arco de EXP (que se llena animado al ganarla) y sus PS.
 * Con `preview` (entrenamiento elegido sin aceptar) el arco marca hasta dónde llegará y el nivel dice cuántos sube;
 * si sube de nivel, el arco pasa a ser el del nivel final. Cada nivel que sube con la ficha abierta se celebra.
 */
export function MonHero({ mon, preview = null }: { mon: OwnedMon; preview?: TrainPlan | null }) {
  const sp = species(mon.speciesId)
  const hpMax = maxHp(mon)
  const shown = useAnimatedExp(mon.level, mon.exp)
  // Nivel al abrir la ficha: solo se celebran los que sube a partir de ahí
  const [openedAt] = useState(mon.level)
  const leveledUp = shown.level > openedAt
  const spriteRef = useRef<HTMLSpanElement>(null)

  // Salto del Pokémon en cada nivel; con la API de animaciones para no volver a montar (y recargar) el sprite
  useEffect(() => {
    if (leveledUp && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) spriteRef.current?.animate(LEVEL_UP_JUMP, { duration: 500, easing: 'cubic-bezier(0.3, 1.6, 0.5, 1)' })
  }, [shown.level, leveledUp])
  const previewEnd = preview && preview.exp / expToNext(preview.level)
  const levelsUp = !!preview && preview.levelsGained > 0

  return (
    <HeroLayout
      scenery={TYPE_SCENERY[sp.types[0]]}
      name={sp.name}
      stars={mon.stars}
      subtitle={
        <>
          <span key={shown.level} className="level-pop">
            Nv. {shown.level}
          </span>
          {levelsUp && <span className="level-gain">+{preview.levelsGained}</span>}
        </>
      }
      footer={
        <>
          <Bar value={mon.hp} max={hpMax} kind="hp" />
          <span className="small">
            {Math.floor(mon.hp)} / {hpMax} PS
          </span>
        </>
      }
    >
      <ExpArc progress={levelsUp ? 0 : shown.progress} preview={previewEnd} previewTip={levelsUp} label={`EXP ${mon.exp} de ${expToNext(mon.level)}`} />
      <span ref={spriteRef} className="level-up-jump">
        <Sprite id={mon.speciesId} size={128} className="mon-hero-sprite idle-bounce" />
      </span>
      {leveledUp && <LevelUpBurst key={shown.level} level={shown.level} />}
    </HeroLayout>
  )
}
