import { useEffect, useRef, useState } from 'react'
import { expToNext } from '../../../game/team/stats'

/** Milisegundos que tarda el arco en llenar un nivel entero cuando sube la EXP */
const MS_PER_LEVEL = 700

/** Nivel con la fracción de EXP como decimales: 12.5 es Nv. 12 con la mitad de su EXP */
const position = (level: number, exp: number) => level + exp / expToNext(level)

/**
 * Nivel y fracción de EXP que se pintan: cuando el Pokémon gana EXP, el arco avanza poco a poco hasta los valores
 * nuevos, vaciándose y subiendo el nivel en cada vuelta. Si baja (otro Pokémon) o se prefiere sin movimiento, salta.
 */
export function useAnimatedExp(level: number, exp: number): { level: number; progress: number } {
  const target = position(level, exp)
  const [shown, setShown] = useState(target)
  const shownRef = useRef(target)

  useEffect(() => {
    const from = shownRef.current
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (target <= from || reduced) {
      shownRef.current = target
      setShown(target)
      return
    }
    const duration = Math.max(MS_PER_LEVEL / 2, (target - from) * MS_PER_LEVEL)
    const start = performance.now()
    let frame = requestAnimationFrame(function step(now) {
      const t = Math.min(1, (now - start) / duration)
      shownRef.current = from + (target - from) * (1 - (1 - t) ** 2)
      setShown(shownRef.current)
      if (t < 1) frame = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(frame)
  }, [target])

  const shownLevel = Math.floor(shown)
  return { level: shownLevel, progress: shown - shownLevel }
}
