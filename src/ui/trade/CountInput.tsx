import { useEffect, useState, type FocusEvent } from 'react'
import { useCorrectionGuard } from './correctionGuard'

interface Props {
  value: number
  max: number
  onChange: (n: number) => void
  /** Avisa de si lo escrito aún no vale (vacío o fuera de 1…max), para no aceptar hasta que se corrija */
  onInvalid?: (invalid: boolean) => void
  /** Se acaba de corregir lo escrito: el botón que lo ha provocado no debe hacer nada más (ver correctionGuard) */
  onCorrected?: () => void
  label: string
}

const digits = (text: string) => text.replace(/\D/g, '').replace(/^0+(?=\d)/, '')

/**
 * Cantidad entre 1 y `max` con − y +, que también se puede escribir. Al tocar el campo se selecciona el número, así
 * lo escrito lo sustituye; mientras se escribe se deja vacío o fuera de rango y, al salir del campo, se corrige con
 * un aviso
 */
export function CountInput({ value, max, onChange, onInvalid, onCorrected, label }: Props) {
  // Lo escrito sin aceptar todavía; null cuando el campo enseña `value`
  const [draft, setDraft] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const clamp = (n: number) => Math.max(1, Math.min(max, n))
  // − y + tampoco cuentan en el toque que corrige: así se ve el aviso
  const correction = useCorrectionGuard()
  // Si el campo desaparece a medio escribir (otra pestaña), lo que queda ya no está sin corregir
  useEffect(() => () => onInvalid?.(false), [onInvalid])

  function edit(text: string) {
    const clean = digits(text)
    const n = Number(clean)
    const valid = clean !== '' && n >= 1 && n <= max
    setDraft(clean)
    setNotice(null)
    onInvalid?.(!valid)
    if (valid) onChange(n)
  }

  /** Al salir del campo, lo que no vale se corrige y se avisa */
  function commit() {
    if (draft === null) return
    const n = Number(draft)
    setDraft(null)
    onInvalid?.(false)
    if (draft === '' || n < 1) setNotice('Como mínimo 1.')
    else if (n > max) setNotice(`Como máximo ${max.toLocaleString('es-ES')}.`)
    if (draft === '' || n < 1 || n > max) {
      onChange(clamp(n))
      correction.onCorrected()
      onCorrected?.()
    }
  }

  const step = correction.guard((delta: number) => {
    setNotice(null)
    onChange(clamp(value + delta))
  })
  const selectAll = (e: FocusEvent<HTMLInputElement>) => e.target.select()

  return (
    <div className="count-field">
      <div className="count-input">
        <button className="btn round-btn" onClick={() => step(-1)} disabled={value <= 1} aria-label="Uno menos">
          −
        </button>
        <input
          className="text-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={draft ?? String(value)}
          aria-label={label}
          onFocus={selectAll}
          onChange={(e) => edit(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        <button className="btn round-btn" onClick={() => step(1)} disabled={value >= max} aria-label="Uno más">
          +
        </button>
      </div>
      {notice && <span className="tiny count-notice">{notice}</span>}
    </div>
  )
}
