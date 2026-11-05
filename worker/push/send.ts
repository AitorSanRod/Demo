import type { Env } from '../env'
import { deleteJob, deleteSubscriber, dueJobs } from './store'
import { parseVapidKey, sendPush } from './webPush'

// La tarea programada manda los avisos que ya tocan. Pocos por vez: cada uno cifra y firma, y el Worker gratuito tiene
// poca CPU por ejecución; los que no quepan salen en la siguiente (un minuto después).

/** Avisos que se mandan como mucho en cada ejecución de la tarea programada */
const SENDS_PER_RUN = 20
/** Milisegundos reales que se reintenta un aviso que el servicio de push no aceptó (caído, demasiadas peticiones) */
const RETRY_FOR_MS = 60 * 60_000
/** Respuestas del servicio de push que dicen que la suscripción ya no existe (el jugador quitó el permiso) */
const GONE = [404, 410]

/** Identificación del remitente que piden los servicios de push (un contacto) */
const subjectOf = (env: Env) => (env.MAIL_FROM ? `mailto:${env.MAIL_FROM.trim()}` : 'mailto:pokerancho@example.com')

export async function sendDuePushes(env: Env, now: number) {
  const vapid = parseVapidKey(env.VAPID_KEY)
  if (!vapid) return
  for (const job of await dueJobs(env.DB, now, SENDS_PER_RUN)) {
    const payload = JSON.stringify({ title: job.title, body: job.body, tag: `${job.topic}:${job.key}` })
    const status = await sendPush(job.target, payload, vapid, subjectOf(env), now).catch(() => 0)
    if (GONE.includes(status)) await deleteSubscriber(env.DB, job.target.endpoint)
    else if ((status >= 200 && status < 300) || now - job.dueAt > RETRY_FOR_MS) await deleteJob(env.DB, job)
    else console.error(`El servicio de push no ha aceptado el aviso ${job.topic}:${job.key} (${status}); se reintenta`)
  }
}
