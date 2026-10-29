import { useEffect, useRef } from 'react'
import { route } from '../data/maps'
import { species } from '../data/species'
import { isExpeditionDone } from '../game/expedition'
import { findMon, type GameState } from '../game/state'

/** Preferencia de este dispositivo (no va en la partida: el permiso de notificaciones es del navegador) */
const PREF_KEY = 'pokerancho-notify'
const ICON = 'icons/icon-192.png'

export type NotifyStatus = 'unsupported' | 'denied' | 'off' | 'on'

function readPref(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) === '1'
  } catch {
    return false
  }
}

function writePref(on: boolean) {
  try {
    localStorage.setItem(PREF_KEY, on ? '1' : '0')
  } catch {
    // Sin almacenamiento: la preferencia dura lo que la pestaña
  }
}

export function notifyStatus(): NotifyStatus {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.permission === 'granted' && readPref() ? 'on' : 'off'
}

export async function enableNotifications(): Promise<NotifyStatus> {
  const permission = await Notification.requestPermission()
  writePref(permission === 'granted')
  return notifyStatus()
}

export function disableNotifications(): NotifyStatus {
  writePref(false)
  return notifyStatus()
}

/** En Android solo se pueden mostrar desde el service worker; sin él (p. ej. en desarrollo) se usa la API directa */
async function show(title: string, body: string, tag: string) {
  const registration = await navigator.serviceWorker?.getRegistration()
  if (registration) await registration.showNotification(title, { body, icon: ICON, tag })
  else new Notification(title, { body, icon: ICON, tag })
}

/**
 * Avisa con una notificación del sistema cuando termina una expedición, solo si la app está en segundo plano:
 * con la app delante ya se ve el aviso de la pestaña Ruta, y así al abrirla no saltan las que acabaron mientras
 * estaba cerrada.
 */
export function useExpeditionNotifications(game: GameState) {
  const notified = useRef(new Set<string>())

  useEffect(() => {
    const current = new Set(game.expeditions.map((e) => e.uid))
    for (const uid of notified.current) if (!current.has(uid)) notified.current.delete(uid)

    for (const e of game.expeditions.filter(isExpeditionDone)) {
      if (notified.current.has(e.uid)) continue
      notified.current.add(e.uid)
      const mon = findMon(game, e.uid)
      if (!mon || !document.hidden || notifyStatus() !== 'on') continue
      const name = species(mon.speciesId).name
      void show(`¡${name} ha vuelto!`, `Ha terminado su expedición por ${route(e.routeId).name}. Toca para recoger el premio.`, e.uid)
    }
  }, [game])
}
