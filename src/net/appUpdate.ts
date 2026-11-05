import { useSyncExternalStore } from 'react'
import { registerSW } from 'virtual:pwa-register'

// Versiones nuevas de la app. El service worker de una versión nueva se queda esperando y aquí se avisa al jugador
// para que recargue (o cierre y abra la app). Con la app abierta mucho rato, se mira cada poco si hay una nueva.

/** Si la versión nueva no ha tomado el control en este tiempo (p. ej. la página aún no la llevaba ninguna), se recarga igual */
const RELOAD_FALLBACK_MS = 3_000
/** Milisegundos reales entre comprobaciones de versión nueva con la app abierta (también se mira al volver a ella) */
const UPDATE_CHECK_MS = 15 * 60_000

interface AppUpdate {
  /** Hay una versión nueva descargada, lista para usarse al recargar */
  ready: boolean
  /** El jugador ha dicho «Más tarde»: se vuelve a avisar la próxima vez que vuelva a la app */
  dismissed: boolean
}

let update: AppUpdate = { ready: false, dismissed: false }
const listeners = new Set<() => void>()
let activate: ((reload?: boolean) => Promise<void>) | null = null

function set(patch: Partial<AppUpdate>) {
  update = { ...update, ...patch }
  listeners.forEach((l) => l())
}

/** Comprueba si hay versión nueva cada UPDATE_CHECK_MS y al volver a la app */
function watchForUpdates(registration: ServiceWorkerRegistration) {
  const check = () => void registration.update().catch(() => undefined)
  setInterval(check, UPDATE_CHECK_MS)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return
    check()
    if (update.ready) set({ dismissed: false })
  })
}

/** Registra el service worker (una vez, en main.tsx) */
export function startAppUpdates() {
  activate = registerSW({
    immediate: true,
    onNeedRefresh: () => set({ ready: true, dismissed: false }),
    onRegisteredSW: (_url, registration) => registration && watchForUpdates(registration),
  })
}

/** Pasa a la versión nueva: la partida se guarda al salir de la página (store.ts) y la app se recarga */
export function reloadToUpdate() {
  void activate?.(true)
  setTimeout(() => location.reload(), RELOAD_FALLBACK_MS)
}

export const dismissUpdate = () => set({ dismissed: true })

export function useAppUpdate(): AppUpdate {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => update,
  )
}
