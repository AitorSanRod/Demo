import { useSyncExternalStore } from 'react'
import { CloudAction, cloudAction, cloudUpload, stateFromSaved, type CloudLink, type CloudSave } from '../game/core/cloudSave'
import { getState, replaceState } from '../game/core/store'
import { account, AccountStatus, refreshAccount, subscribeAccount } from './account'

// Mantiene la partida de la cuenta en la nube (worker/save.ts): al entrar o al volver a la app baja la
// de la nube si otro dispositivo ha jugado después; con la app delante la sube cada poco y al ocultarla. Gana la
// última subida: si al subir resulta que otro dispositivo subió antes, se carga la suya y se avisa.

const SAVE_API = '/api/save'
/** Lo que el dispositivo recuerda de la nube (ver CloudLink), aparte de la partida */
const LINK_KEY = 'pokerancho-cloud'
/** Milisegundos reales entre subidas con la app delante */
const UPLOAD_EVERY_MS = 2 * 60_000
/** Cada cuánto se mira si toca subir */
const LOOP_MS = 15_000
/** Bytes como mucho para subir con keepalive al ocultar la app (el navegador no deja más) */
const KEEPALIVE_MAX_BYTES = 60_000

interface CloudState {
  /** Hora real (ms) de la última vez que la partida quedó igual aquí y en la nube */
  syncedAt: number | null
  /** La cuenta ya tenía partida y aquí hay otra: el jugador elige cuál se queda */
  choice: CloudSave | null
  notice: string | null
  /** La última vez no se pudo hablar con el servidor */
  failing: boolean
}

let cloud: CloudState = { syncedAt: null, choice: null, notice: null, failing: false }
const listeners = new Set<() => void>()
let busy = false
let lastUploadAt = 0

function update(patch: Partial<CloudState>) {
  cloud = { ...cloud, ...patch }
  listeners.forEach((l) => l())
}

function readLink(): CloudLink | null {
  try {
    return JSON.parse(localStorage.getItem(LINK_KEY) ?? 'null') as CloudLink | null
  } catch {
    return null
  }
}

function writeLink(link: CloudLink | null) {
  try {
    if (link) localStorage.setItem(LINK_KEY, JSON.stringify(link))
    else localStorage.removeItem(LINK_KEY)
  } catch {
    // Sin almacenamiento: se volverá a preguntar al entrar
  }
}

const userId = () => (account().status === AccountStatus.SignedIn ? account().user!.id : null)

/** La partida de la nube pasa a ser la de aquí */
function loadCloudSave(saved: CloudSave, notice: string | null = null) {
  replaceState(stateFromSaved(saved.save, saved.team))
  writeLink({ userId: userId()!, revision: saved.revision })
  update({ syncedAt: Date.now(), choice: null, notice: notice ?? cloud.notice })
}

/** Sin sesión válida (ha caducado o se cerró en otro sitio): se vuelve a preguntar quién es y se para */
const SESSION_LOST = 401

async function checked(res: Response): Promise<Response> {
  if (res.status === SESSION_LOST) await refreshAccount()
  if (!res.ok && res.status !== 409) throw new Error(`${SAVE_API}: ${res.status}`)
  return res
}

async function fetchCloud(): Promise<CloudSave | null> {
  const res = await checked(await fetch(SAVE_API, { cache: 'no-store' }))
  return ((await res.json()) as { cloud: CloudSave | null }).cloud
}

/** Sube la partida de aquí encima de la revisión `base` de la nube */
async function upload(base: number | null, keepalive = false) {
  const body = JSON.stringify({ baseRevision: base, ...cloudUpload(getState()) })
  lastUploadAt = Date.now()
  const res = await checked(
    await fetch(SAVE_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: keepalive && body.length <= KEEPALIVE_MAX_BYTES }),
  )
  if (res.status === 409) {
    const newer = ((await res.json()) as { cloud: CloudSave | null }).cloud
    if (newer) loadCloudSave(newer, 'Se ha jugado con tu cuenta en otro dispositivo: se ha cargado esa partida.')
    return
  }
  writeLink({ userId: userId()!, revision: ((await res.json()) as { revision: number }).revision })
  update({ syncedAt: Date.now() })
}

/** Lo que el dispositivo cree que es la última revisión de la nube de esta cuenta */
const knownRevision = () => {
  const link = readLink()
  return link?.userId === userId() ? link.revision : null
}

/** Una operación con la nube a la vez; los fallos de red solo se anotan (se reintenta más tarde) */
async function exclusive(run: () => Promise<void>) {
  if (busy || !userId()) return
  busy = true
  try {
    await run()
    update({ failing: false })
  } catch {
    update({ failing: true })
  } finally {
    busy = false
  }
}

/** Al entrar en la cuenta o volver a la app: subir, bajar o preguntar (ver cloudAction) */
const connect = () =>
  exclusive(async () => {
    const saved = await fetchCloud()
    const action = cloudAction(readLink(), userId()!, saved, getState())
    if (action === CloudAction.Upload) await upload(saved?.revision ?? null)
    else if (action === CloudAction.Download) loadCloudSave(saved!)
    else update({ choice: saved })
  })

/** Sube si toca (no mientras el jugador elige partida) */
const uploadNow = (keepalive = false) => (cloud.choice ? Promise.resolve() : exclusive(() => upload(knownRevision(), keepalive)))

/** Subir ya, sin esperar a la siguiente vez (botón «Guardar ahora») */
export const saveNow = () => uploadNow()

/** El jugador elige entre la partida de la nube y la de aquí */
export function chooseSave(keepCloud: boolean) {
  const saved = cloud.choice
  if (!saved) return
  if (keepCloud) return loadCloudSave(saved)
  update({ choice: null })
  void exclusive(() => upload(saved.revision))
}

/** Antes de salir de la cuenta se sube lo último; la partida sigue aquí, ya sin cuenta */
export async function beforeSignOut() {
  await uploadNow()
  writeLink(null)
  update({ syncedAt: null, choice: null })
}

export const dismissCloudNotice = () => update({ notice: null })

/** Arranca la sincronización (una vez, en App); devuelve cómo pararla */
export function startCloudSync(): () => void {
  let lastUser: string | null = null
  const onAccount = () => {
    if (userId() && userId() !== lastUser) void connect()
    lastUser = userId()
  }
  const unsubscribe = subscribeAccount(onAccount)
  const id = setInterval(() => {
    if (!document.hidden && Date.now() - lastUploadAt >= UPLOAD_EVERY_MS) void uploadNow()
  }, LOOP_MS)
  const onVisibility = () => void (document.hidden ? uploadNow(true) : connect())
  document.addEventListener('visibilitychange', onVisibility)
  onAccount()
  return () => {
    unsubscribe()
    clearInterval(id)
    document.removeEventListener('visibilitychange', onVisibility)
  }
}

export function useCloud(): CloudState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => cloud,
  )
}
