import { useEffect, useRef } from 'react'

/**
 * Para que el toque que corrige una cantidad mal escrita no haga además lo del botón tocado. Tocar un botón con el
 * campo activo lo saca del campo (y lo corrige, ver CountInput) antes de soltar el dedo, y entonces el botón ya
 * estaría activo: ese toque solo corrige y avisa; el siguiente ya cuenta. `guard` envuelve la acción del botón y
 * `onCorrected` se llama al corregir
 */
export function useCorrectionGuard() {
  const skip = useRef(false)
  useEffect(() => {
    // Un toque nuevo empieza limpio (la corrección llega después, al salir del campo con ese mismo toque)
    const clear = () => void (skip.current = false)
    document.addEventListener('pointerdown', clear, true)
    return () => document.removeEventListener('pointerdown', clear, true)
  }, [])

  const onCorrected = () => void (skip.current = true)
  const guard =
    <A extends unknown[]>(run: (...args: A) => void) =>
    (...args: A) => {
      if (skip.current) skip.current = false
      else run(...args)
    }
  return { onCorrected, guard }
}
