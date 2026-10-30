import { useSyncExternalStore } from 'react'
import { initialState, restoreState, type GameState } from './state'

const SAVE_KEY = 'pokerancho-save'

function load(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) {
      const restored = restoreState(JSON.parse(raw))
      if (restored) return restored
    }
  } catch {
    // Partida corrupta o almacenamiento no disponible: se empieza de cero
  }
  return initialState()
}

let state = load()
const listeners = new Set<() => void>()
let saveTimer: number | undefined

function save() {
  saveTimer = undefined
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state))
  } catch {
    // Sin almacenamiento: la partida dura lo que la pestaña
  }
}

function scheduleSave() {
  saveTimer ??= window.setTimeout(save, 500)
}

window.addEventListener('pagehide', save)
document.addEventListener('visibilitychange', () => document.hidden && save())

function getState(): GameState {
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
