import type { CloudLink } from '../game/core/cloudSave'

// Lo que el dispositivo recuerda de la nube (ver CloudLink), aparte de la partida: de qué cuenta es y qué revisión vio

const LINK_KEY = 'pokerancho-cloud'

export function readLink(): CloudLink | null {
  try {
    return JSON.parse(localStorage.getItem(LINK_KEY) ?? 'null') as CloudLink | null
  } catch {
    return null
  }
}

export function writeLink(link: CloudLink | null) {
  try {
    if (link) localStorage.setItem(LINK_KEY, JSON.stringify(link))
    else localStorage.removeItem(LINK_KEY)
  } catch {
    // Sin almacenamiento: se volverá a preguntar al entrar
  }
}
