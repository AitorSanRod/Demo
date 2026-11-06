import { useSyncExternalStore } from 'react'
import { CloudAction, cloudAction, cloudUpload, stateFromSaved, type CloudSave } from '../game/core/cloudSave'
import { getState, replaceState } from '../game/core/store'
import { account, AccountStatus, refreshAccount, subscribeAccount } from './account'
import { readLink, writeLink } from './cloudLink'

// Mantiene la partida de la cuenta en la nube (worker/save.ts): al entrar o al volver a la app baja la
// de la nube si otro dispositivo ha jugado después; con la app delante la sube cada poco y al ocultarla. Gana la
// última subida: si al subir resulta que otro dispositivo subió antes, se carga la suya y se avisa.

const SAVE_API = '/api/save'
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

/** Milisegundos entre miradas a si ha acabado la operación con la nube en curso */
const WAIT_STEP_MS = 100

/**
 * Para los intercambios: espera a que no haya otra operación con la nube, sube la partida y, con la nube ya igual que
 * aquí, hace `run` con su revisión. `run` cambia la partida igual que el servidor y llama a `adoptRevision` con la
 * nueva. Si algo falla a medias, se vuelve a mirar la nube (si el servidor llegó a cambiarla, se baja)
 */
export async function withCloudInSync<T>(run: (revision: number, adoptRevision: (revision: number) => void) => Promise<T>): Promise<T> {
  while (busy) await new Promise((resolve) => setTimeout(resolve, WAIT_STEP_MS))
  if (!userId() || cloud.choice) throw new Error('Sin partida en la nube')
  busy = true
  try {
    await upload(knownRevision())
    const revision = knownRevision()
    if (revision === null) throw new Error('Sin partida en la nube')
    return await run(revision, (next) => writeLink({ userId: userId()!, revision: next }))
  } catch (e) {
    busy = false
    void connect()
    throw e
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
