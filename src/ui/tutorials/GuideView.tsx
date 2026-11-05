import { useState } from 'react'
import { ItemIcon } from '../shared/ItemIcon'
import type { Guide } from './guides/guide'

/** Una guía paso a paso: la captura con lo importante resaltado, qué hacer y los botones para avanzar */
export function GuideView({ guide, onBack }: { guide: Guide; onBack: () => void }) {
  const [index, setIndex] = useState(0)
  const step = guide.steps[index]
  const last = index === guide.steps.length - 1

  return (
    <>
      <div className="row between">
        <h2 className="with-icon">
          <ItemIcon item={guide.icon} size={32} /> {guide.title}
        </h2>
        <button className="account-link" onClick={onBack}>
          Tutoriales
        </button>
      </div>
      <figure className="guide-shot">
        <img key={step.image} src={step.image} alt={step.title} />
      </figure>
      <div className="guide-text">
        <span className="guide-step-number">
          Paso {index + 1} de {guide.steps.length}
        </span>
        <strong>{step.title}</strong>
        <p className="small">{step.text}</p>
      </div>
      <div className="guide-dots" aria-hidden>
        {guide.steps.map((s, i) => (
          <span key={s.image + i} className={i === index ? 'on' : ''} />
        ))}
      </div>
      <div className="guide-nav">
        <button className="btn" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          Anterior
        </button>
        <button className="btn primary" onClick={() => (last ? onBack() : setIndex(index + 1))}>
          {last ? 'Terminar' : 'Siguiente'}
        </button>
      </div>
    </>
  )
}
