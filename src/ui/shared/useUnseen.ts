import { useEffect, useSyncExternalStore } from 'react'

/** Clave de `localStorage` con el último aviso visto de cada sitio */
const STORAGE_KEY = 'pokerancho-seen-badges'

let seen: Record<string, string> = load()
const listeners = new Set<() => void>()

function load(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}

function save(next: Record<string, string>) {
  seen = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seen))
  } catch {
    // Sin almacenamiento el aviso se recuerda solo mientras la app siga abierta
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * Aviso (punto rojo o contador) que se apaga al entrar donde avisa y vuelve si cambia lo que hay pendiente.
 * `pending` resume lo pendiente (p. ej. los ids listos, unidos); null si no hay nada. `viewing`: se está ahí ahora.
 */
export function useUnseen(id: string, pending: string | null, viewing: boolean): boolean {
  const last = useSyncExternalStore(subscribe, () => seen[id])
  useEffect(() => {
    if (pending === null && seen[id] !== undefined) {
      const rest = { ...seen }
      delete rest[id]
      save(rest)
    } else if (pending !== null && viewing && seen[id] !== pending) {
      save({ ...seen, [id]: pending })
    }
  }, [id, pending, viewing])
  return pending !== null && !viewing && last !== pending
}

/** Lista de ids como resumen de lo pendiente para `useUnseen`; null si está vacía */
export const pendingKey = (ids: readonly (string | number)[]): string | null => (ids.length ? ids.join(',') : null)
