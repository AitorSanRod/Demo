import { describe, expect, it } from 'vitest'
import { fromBase64Url, toBase64Url } from '../base64url'
import { encryptPush, parseVapidKey, vapidAuthorization, type PushTarget } from './webPush'

const enc = new TextEncoder()
/** Parámetros de ECDH (la clave pública del otro lado); los tipos de Workers y de Node los llaman distinto */
type EcdhParams = Parameters<typeof crypto.subtle.deriveBits>[0]

/** Hace de navegador: sus claves de suscripción */
async function browser() {
  const keys = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])) as CryptoKeyPair
  const p256dh = new Uint8Array((await crypto.subtle.exportKey('raw', keys.publicKey)) as ArrayBuffer)
  const auth = crypto.getRandomValues(new Uint8Array(16))
  const target: PushTarget = { endpoint: 'https://push.example.com/abc', p256dh: toBase64Url(p256dh), auth: toBase64Url(auth) }
  return { keys, p256dh, auth, target }
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, bytes: number) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, bytes * 8))
}

/** Lo que haría el navegador al recibirlo (RFC 8291) */
async function decrypt(body: Uint8Array, b: Awaited<ReturnType<typeof browser>>): Promise<string> {
  const salt = body.slice(0, 16)
  const idLen = body[20]
  const asPublic = body.slice(21, 21 + idLen)
  const sealed = body.slice(21 + idLen)
  const asKey = await crypto.subtle.importKey('raw', asPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: asKey } as unknown as EcdhParams, b.keys.privateKey, 256))
  const info = new Uint8Array([...enc.encode('WebPush: info\0'), ...b.p256dh, ...asPublic])
  const prk = await hkdf(b.auth, shared, info, 32)
  const cek = await hkdf(salt, prk, enc.encode('Content-Encoding: aes128gcm\0'), 16)
  const nonce = await hkdf(salt, prk, enc.encode('Content-Encoding: nonce\0'), 12)
  const aes = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['decrypt'])
  const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, aes, sealed))
  expect(plain.at(-1)).toBe(2)
  return new TextDecoder().decode(plain.slice(0, -1))
}

async function vapidSecret(): Promise<string> {
  const keys = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])) as CryptoKeyPair
  return JSON.stringify(await crypto.subtle.exportKey('jwk', keys.privateKey))
}

describe('Web Push', () => {
  it('el navegador puede descifrar el aviso con sus claves', async () => {
    const b = await browser()
    const payload = JSON.stringify({ title: '¡Ha vuelto!', body: 'Expedición terminada' })
    expect(await decrypt(await encryptPush(payload, b.target), b)).toBe(payload)
  })

  it('la firma VAPID va para el servicio de push del navegador y se verifica con la clave pública', async () => {
    const vapid = parseVapidKey(await vapidSecret())!
    const header = await vapidAuthorization('https://push.example.com/abc', vapid, 'mailto:yo@example.com', 1_000_000)
    const [, jwt, k] = header.match(/^vapid t=([^,]+), k=(.+)$/)!
    expect(k).toBe(vapid.publicKey)
    const [h, c, sig] = jwt.split('.')
    expect(JSON.parse(new TextDecoder().decode(fromBase64Url(c)))).toMatchObject({ aud: 'https://push.example.com', sub: 'mailto:yo@example.com' })
    const pub = await crypto.subtle.importKey('raw', fromBase64Url(k), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
    expect(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pub, fromBase64Url(sig), enc.encode(`${h}.${c}`))).toBe(true)
  })

  it('sin clave VAPID válida no hay push', () => {
    expect(parseVapidKey(undefined)).toBeNull()
    expect(parseVapidKey('{"kty":"RSA"}')).toBeNull()
  })
})
