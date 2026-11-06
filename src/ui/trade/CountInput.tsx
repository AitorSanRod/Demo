/** Cantidad entre 1 y `max` con − y +, que también se puede escribir */
export function CountInput({ value, max, onChange, label }: { value: number; max: number; onChange: (n: number) => void; label: string }) {
  const set = (n: number) => onChange(Math.max(1, Math.min(max, Math.floor(n) || 1)))

  return (
    <div className="count-input">
      <button className="btn round-btn" onClick={() => set(value - 1)} disabled={value <= 1} aria-label="Uno menos">
        −
      </button>
      <input
        className="text-input"
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={value}
        aria-label={label}
        onChange={(e) => set(Number(e.target.value))}
      />
      <button className="btn round-btn" onClick={() => set(value + 1)} disabled={value >= max} aria-label="Uno más">
        +
      </button>
    </div>
  )
}
