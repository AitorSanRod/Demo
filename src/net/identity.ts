import { useSyncExternalStore } from 'react'
import { cleanNickname } from '../game/raid/online/requests'

// Quién es este dispositivo en las salas compartidas: el id de su cuenta si ha entrado en una (net/account.ts) o, si
// no, un id anónimo al azar; y el apodo que elija el jugador. Se guarda aparte de la partida (como el aviso de
// expediciones) para que sobreviva a los cambios de versión.

const IDENTITY_KEY = 'pokerancho-online'

interface Identity {
  playerId: string
  /** null hasta que el jugador elige uno */
  nickname: string | null
}

function load(): Identity {
  try {
    const saved = JSON.parse(localStorage.getItem(IDENTITY_KEY) ?? 'null') as Identity | null
    if (saved?.playerId) return saved
  } catch {
    // Guardado corrupto o almacenamiento no disponible: identidad nueva
  }
  return { playerId: crypto.randomUUID(), nickname: null }
}

let identity = load()
const listeners = new Set<() => void>()

function save() {
  try {
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity))
  } catch {
    // Sin almacenamiento: la identidad dura lo que la pestaña
  }
}
save()

/** Id de la cuenta con la que se ha entrado: con él, los asientos de las salas son los mismos en cualquier dispositivo */
let accountId: string | null = null

export function setAccountId(id: string | null) {
  accountId = id
}

export const playerId = (): string => accountId ?? identity.playerId

export const nickname = (): string | null => identity.nickname

/** Guarda el apodo ya limpio (el servidor lo limpia igual) y lo devuelve */
export function setNickname(name: string): string {
  identity = { ...identity, nickname: cleanNickname(name) }
  save()
  listeners.forEach((l) => l())
  return identity.nickname!
}

export function useNickname(): string | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    nickname,
  )
}
