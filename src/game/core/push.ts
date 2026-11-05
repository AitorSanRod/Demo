// Notificaciones push (worker/push): lo que comparten la web y el servidor. Cada aviso es de un tema, que el jugador
// activa o no en Ajustes; los de expediciones y ruta los programa el móvil (solo él sabe cuándo acaban) y los del
// obsequio y las raids, el servidor.

export const PushTopic = { Expedition: 'expedition', Gift: 'gift', Raid: 'raid', Run: 'run' } as const
export type PushTopic = (typeof PushTopic)[keyof typeof PushTopic]

export const PUSH_TOPICS: PushTopic[] = Object.values(PushTopic)

/** Temas que programa el móvil: el servidor los sustituye enteros cada vez que el móvil manda su plan */
export const CLIENT_TOPICS: PushTopic[] = [PushTopic.Expedition, PushTopic.Run]

/** Un aviso programado */
export interface PushJob {
  topic: PushTopic
  /** Distingue avisos del mismo tema (p. ej. el uid de la expedición); uno nuevo con la misma clave sustituye al anterior */
  key: string
  /** Hora real (ms) a la que se manda */
  dueAt: number
  title: string
  body: string
}

/** Avisos que puede tener programados un dispositivo a la vez (de los que programa el móvil) */
export const MAX_CLIENT_JOBS = 20
/** Letras como mucho del título y del texto de un aviso */
export const MAX_PUSH_TEXT = 160
/** Milisegundos reales como mucho hacia el futuro de un aviso programado */
export const MAX_PUSH_AHEAD_MS = 2 * 24 * 60 * 60 * 1000

const isText = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= MAX_PUSH_TEXT

export const isPushTopic = (v: unknown): v is PushTopic => PUSH_TOPICS.includes(v as PushTopic)

/** Los temas que pide el dispositivo, sin repetir; null si alguno no existe */
export function parseTopics(v: unknown): PushTopic[] | null {
  if (!Array.isArray(v) || !v.every(isPushTopic)) return null
  return [...new Set(v)]
}

/** El plan de avisos que manda el móvil (solo de sus temas, con fecha razonable); null si algo no encaja */
export function parseClientJobs(v: unknown, now: number): PushJob[] | null {
  if (!Array.isArray(v) || v.length > MAX_CLIENT_JOBS) return null
  const jobs = v.filter(
    (j): j is PushJob =>
      typeof j === 'object' &&
      j !== null &&
      CLIENT_TOPICS.includes(j.topic) &&
      isText(j.key) &&
      Number.isFinite(j.dueAt) &&
      j.dueAt <= now + MAX_PUSH_AHEAD_MS &&
      isText(j.title) &&
      isText(j.body),
  )
  return jobs.length === v.length ? jobs.map(({ topic, key, dueAt, title, body }) => ({ topic, key, dueAt: Math.max(now, dueAt), title, body })) : null
}
