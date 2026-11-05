import { useState } from 'react'
import { MenuSheetHeader } from '../ranch/MenuSheetHeader'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { GuideView } from './GuideView'
import { GUIDES } from './guides'
import './tutorials.css'

/** Tutoriales (menú del rancho): la lista de guías y, al elegir una, sus pasos con capturas */
export function TutorialsSheet({ onBack }: { onBack: () => void }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const guide = GUIDES.find((g) => g.id === openId)
  if (guide) return <GuideView key={guide.id} guide={guide} onBack={() => setOpenId(null)} />

  return (
    <>
      <MenuSheetHeader icon={ICON.Tutorials} title="Tutoriales" onBack={onBack} />
      {GUIDES.map((g) => (
        <button key={g.id} className="ranch-menu-item" onClick={() => setOpenId(g.id)}>
          <ItemIcon item={g.icon} size={36} />
          <span className="grow">
            <strong>{g.title}</strong>
            <span className="tiny muted ranch-menu-hint">{g.summary}</span>
          </span>
          <span className="tiny muted">{g.steps.length} pasos</span>
        </button>
      ))}
    </>
  )
}
