/** Duración legible: "40 s", "12 min", "4 h", "1 h 30 min" */
export function formatMinutes(min: number): string {
  if (min < 1) return `${Math.max(1, Math.round(min * 60))} s`
  if (min < 60) return `${Math.round(min)} min`
  const rest = Math.round(min % 60)
  return rest === 0 ? `${Math.floor(min / 60)} h` : `${Math.floor(min / 60)} h ${rest} min`
}
