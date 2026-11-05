import { fromBase64Url, toBase64Url } from '../base64url'

// Web Push estándar con la Web Crypto del Worker, sin librerías: el servidor se identifica ante el servicio de push del
// navegador con VAPID (RFC 8292, un JWT firmado con ES256) y el mensaje va cifrado para ese navegador (RFC 8291,
// aes128gcm). Las claves VAPID son un secreto del Worker (VAPID_KEY, un JWK de ECDSA P-256; ver docs/servidor.md).

/** Segundos que el servicio de push guarda el aviso si el móvil está apagado */
const PUSH_TTL_S = 24 * 60 * 60
/** Horas que vale la firma VAPID de cada envío (el máximo que admiten los servicios es 24) */
const VAPID_HOURS = 12
/** Tamaño de registro del cifrado aes128gcm (un aviso cabe en uno) */
const RECORD_SIZE = 4096

/** La suscripción de un navegador: adónde se manda y con qué claves se cifra */
export interface PushTarget {
  endpoint: string
  /** Clave pública ECDH P-256 del navegador (base64url, sin comprimir) */
  p256dh: string
  /** Secreto de autenticación del navegador (base64url, 16 bytes) */
  auth: string
}

export interface VapidKey {
  /** Clave pública sin comprimir en base64url: la que usa el navegador para suscribirse */
  publicKey: string
  privateJwk: JsonWebKey
}

const enc = new TextEncoder()
/** Parámetros de ECDH (la clave pública del otro lado); los tipos de Workers y de Node los llaman distinto */
type EcdhParams = Parameters<typeof crypto.subtle.deriveBits>[0]
const concat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let at = 0
  for (const p of parts) {
    out.set(p, at)
    at += p.length
  }
  return out
}

/** Lee el secreto VAPID_KEY (JWK con d, x, y); null si falta o no es una clave P-256 */
export function parseVapidKey(secret: string | undefined): VapidKey | null {
  try {
    const jwk = JSON.parse(secret ?? '') as JsonWebKey
    if (jwk.kty !== 'EC' || jwk.crv !== 'P-256' || !jwk.d || !jwk.x || !jwk.y) return null
    return { publicKey: toBase64Url(concat(new Uint8Array([4]), fromBase64Url(jwk.x), fromBase64Url(jwk.y))), privateJwk: jwk }
  } catch {
    return null
  }
}

/** Cabecera Authorization de VAPID para mandar a `endpoint` (firmada para el servicio de push de ese navegador) */
export async function vapidAuthorization(endpoint: string, vapid: VapidKey, subject: string, now: number): Promise<string> {
  const header = toBase64Url(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const claims = { aud: new URL(endpoint).origin, exp: Math.floor(now / 1000) + VAPID_HOURS * 3600, sub: subject }
  const unsigned = `${header}.${toBase64Url(enc.encode(JSON.stringify(claims)))}`
  const key = await crypto.subtle.importKey('jwk', { ...vapid.privateJwk, key_ops: ['sign'] }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(unsigned))
  return `vapid t=${unsigned}.${toBase64Url(new Uint8Array(signature))}, k=${vapid.publicKey}`
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, bytes: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, bytes * 8))
}

/** Cifra el aviso para el navegador de `target` (RFC 8291): cabecera aes128gcm + un solo registro */
export async function encryptPush(payload: string, target: PushTarget): Promise<Uint8Array> {
  const uaPublic = fromBase64Url(target.p256dh)
  const own = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])) as CryptoKeyPair
  const asPublic = new Uint8Array((await crypto.subtle.exportKey('raw', own.publicKey)) as ArrayBuffer)
  const uaKey = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey } as unknown as EcdhParams, own.privateKey, 256))
  const prk = await hkdf(fromBase64Url(target.auth), shared, concat(enc.encode('WebPush: info\0'), uaPublic, asPublic), 32)
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const cek = await hkdf(salt, prk, enc.encode('Content-Encoding: aes128gcm\0'), 16)
  const nonce = await hkdf(salt, prk, enc.encode('Content-Encoding: nonce\0'), 12)
  const aes = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt'])
  // El 2 marca el último (y único) registro
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aes, concat(enc.encode(payload), new Uint8Array([2]))))
  const rs = new Uint8Array(4)
  new DataView(rs.buffer).setUint32(0, RECORD_SIZE)
  return concat(salt, rs, new Uint8Array([asPublic.length]), asPublic, sealed)
}

/** Manda el aviso; devuelve el estado HTTP del servicio de push (404 o 410: la suscripción ya no existe) */
export async function sendPush(target: PushTarget, payload: string, vapid: VapidKey, subject: string, now: number): Promise<number> {
  const res = await fetch(target.endpoint, {
    method: 'POST',
    headers: {
      TTL: String(PUSH_TTL_S),
      Urgency: 'normal',
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      Authorization: await vapidAuthorization(target.endpoint, vapid, subject, now),
    },
    body: await encryptPush(payload, target),
  })
  return res.status
}
