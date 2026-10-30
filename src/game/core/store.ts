import { useSyncExternalStore } from 'react'
import { initialState, restoreState, type GameState } from './state'
import { backupTeam, parseTeamBackup, restoreTeam } from './teamBackup'

const SAVE_KEY = 'pokerancho-save'
/** Copia del equipo que sobrevive a los cambios de versión (ver teamBackup.ts). Provisional hasta tener servidor */
const TEAM_KEY = 'pokerancho-team'

const readJson = (key: string): unknown => {
  const raw = localStorage.getItem(key)
  return raw ? JSON.parse(raw) : null
}

/** La partida guardada si es de esta versión; si no, una nueva con el equipo recuperado de su copia */
function load(): GameState {
  try {
    const saved = readJson(SAVE_KEY)
    const restored = saved ? restoreState(saved as GameState) : null
    if (restored) return restored
  } catch {
    // Partida corrupta: se empieza de cero (intentando recuperar el equipo)
  }
  const fresh = initialState()
  try {
    const backup = parseTeamBackup(readJson(TEAM_KEY))
    if (backup) restoreTeam(fresh, backup)
  } catch {
    // Copia corrupta o almacenamiento no disponible: partida nueva sin equipo
  }
  return fresh
}

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
