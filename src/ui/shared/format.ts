/** Duración legible: "40 s", "12 min", "4 h", "1 h 30 min" */
export function formatMinutes(min: number): string {
  if (min < 1) return `${Math.max(1, Math.round(min * 60))} s`
  if (min < 60) return `${Math.round(min)} min`
  const rest = Math.round(min % 60)
  return rest === 0 ? `${Math.floor(min / 60)} h` : `${Math.floor(min / 60)} h ${rest} min`
}

/** Cuenta atrás de reloj: "12:34", "1:05:00" */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const [h, m, s] = [Math.floor(total / 3600), Math.floor(total / 60) % 60, total % 60]
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}
