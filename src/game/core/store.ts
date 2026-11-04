import { useSyncExternalStore } from 'react'
import { stateFromSaved } from './cloudSave'
import { initialState, type GameState } from './state'
import { backupTeam } from './teamBackup'

const SAVE_KEY = 'pokerancho-save'
/** Copia del equipo que sobrevive a los cambios de versión (ver teamBackup.ts). Provisional hasta tener servidor */
const TEAM_KEY = 'pokerancho-team'

const readJson = (key: string): unknown => {
  const raw = localStorage.getItem(key)
  return raw ? JSON.parse(raw) : null
}

const readSafely = (key: string): unknown => {
  try {
    return readJson(key)
  } catch {
    // Guardado corrupto o almacenamiento no disponible: como si no lo hubiera
    return null
  }
}

/** La partida guardada si es de esta versión; si no, una nueva con el equipo recuperado de su copia */
const load = (): GameState => stateFromSaved(readSafely(SAVE_KEY), readSafely(TEAM_KEY))

let state = load()
const listeners = new Set<() => void>()
let saveTimer: number | undefined

function save() {
  saveTimer = undefined
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state))
    localStorage.setItem(TEAM_KEY, JSON.stringify(backupTeam(state)))
  } catch {
    // Sin almacenamiento: la partida dura lo que la pestaña
  }
}

function scheduleSave() {
  saveTimer ??= window.setTimeout(save, 500)
}

window.addEventListener('pagehide', save)
document.addEventListener('visibilitychange', () => document.hidden && save())

/** El estado de ahora, para quien lo lee fuera de React (ver net/raidSync.ts); se modifica solo con act() */
export function getState(): GameState {
  return state
}

/** Aplica una modificación sobre una copia del estado y notifica a la UI */
export function act<T>(recipe: (draft: GameState) => T): T {
  const draft = structuredClone(state)
  const result = recipe(draft)
  state = draft
  scheduleSave()
  listeners.forEach((l) => l())
  return result
}

/** Cambia la partida entera por otra (la de la nube, ver net/cloudSync.ts) y la guarda */
export function replaceState(next: GameState) {
  state = next
  save()
  listeners.forEach((l) => l())
}

/** Reiniciar borra también la copia del equipo: se empieza de verdad de cero, con el tutorial */
export function resetGame() {
  state = initialState()
  save()
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useGame(): GameState {
  return useSyncExternalStore(subscribe, getState)
}
