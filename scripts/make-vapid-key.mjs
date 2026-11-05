// Genera las claves VAPID de las notificaciones push (un JWK de ECDSA P-256 con la parte privada) y las escribe por la
// salida estándar, para guardarlas como secreto del Worker sin que se vean:
//   node scripts/make-vapid-key.mjs | npx wrangler secret put VAPID_KEY
// Para `wrangler dev`, en .dev.vars:  VAPID_KEY=<lo que escribe>
// Cambiarlas invalida las suscripciones que ya haya (cada navegador tendría que volver a activar los avisos).
import { webcrypto } from 'node:crypto'

const keys = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
const { kty, crv, d, x, y } = await webcrypto.subtle.exportKey('jwk', keys.privateKey)
process.stdout.write(JSON.stringify({ kty, crv, d, x, y }))
