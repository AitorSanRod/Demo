import type { Env } from './env'

// Correos de las cuentas con Brevo (plan gratuito: 300 al día). Sin BREVO_API_KEY o MAIL_FROM (p. ej. en
// `wrangler dev`), el enlace se escribe en el registro para poder probar.

const BREVO_API = 'https://api.brevo.com/v3/smtp/email'
const SENDER_NAME = 'Pokérancho'

export const MailKind = { Confirm: 'confirm', Reset: 'reset' } as const
export type MailKind = (typeof MailKind)[keyof typeof MailKind]

const MAILS: Record<MailKind, { subject: string; body: (link: string) => string }> = {
  [MailKind.Confirm]: {
    subject: 'Confirma tu cuenta de Pokérancho',
    body: (link) => `<h2>¡Bienvenido a Pokérancho!</h2>
<p>Confirma tu email para guardar tu partida en la nube y seguirla en cualquier dispositivo:</p>
<p><a href="${link}">Confirmar mi cuenta</a></p>
<p>Si no has creado tú esta cuenta, ignora este correo.</p>`,
  },
  [MailKind.Reset]: {
    subject: 'Recupera tu contraseña de Pokérancho',
    body: (link) => `<h2>Recuperar la contraseña de Pokérancho</h2>
<p>Abre este enlace para elegir una contraseña nueva (caduca en una hora):</p>
<p><a href="${link}">Elegir contraseña nueva</a></p>
<p>Si no lo has pedido tú, ignora este correo: tu contraseña sigue igual.</p>`,
  },
}

/** Lo que respondió Brevo, para el registro del Worker (sin la clave) */
async function describe(res: Response): Promise<string> {
  const headers = [...res.headers].map(([k, v]) => `${k}: ${v}`).join('; ')
  return `${res.status} ${res.statusText} | ${headers} | ${(await res.text().catch(() => '')) || '(sin cuerpo)'}`
}

/** Manda el correo; si Brevo falla, lo apunta en el registro y sigue (un correo perdido no debe romper la petición) */
export async function sendMail(env: Env, to: string, kind: MailKind, link: string) {
  if (!env.BREVO_API_KEY || !env.MAIL_FROM) {
    console.log(`[correo sin enviar: faltan BREVO_API_KEY o MAIL_FROM] ${kind} para ${to}: ${link}`)
    return
  }
  const { subject, body } = MAILS[kind]
  try {
    const res = await fetch(BREVO_API, {
      method: 'POST',
      headers: { 'api-key': env.BREVO_API_KEY.trim(), 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ sender: { email: env.MAIL_FROM.trim(), name: SENDER_NAME }, to: [{ email: to }], subject, htmlContent: body(link) }),
    })
    if (!res.ok) console.error(`Brevo no ha mandado el correo ${kind} a ${to}: ${await describe(res)}`)
    if (!res.ok) await diagnose(env.BREVO_API_KEY)
  } catch (e) {
    console.error(`No se ha podido hablar con Brevo para el correo ${kind} a ${to}: ${String(e)}`)
    await diagnose(env.BREVO_API_KEY)
  }
}

// TEMPORAL (diagnóstico del envío con Brevo): se quita en cuanto lleguen los correos
async function diagnose(key: string) {
  const shape = `longitud ${key.length}, empieza por ${key.slice(0, 8)}, espacios o saltos: ${/\s/.test(key)}, comillas: ${/["']/.test(key)}`
  try {
    const res = await fetch('https://api.brevo.com/v3/account', { headers: { 'api-key': key.trim(), Accept: 'application/json' } })
    const text = await res.text()
    const account = text.slice(0, 400).replace(/"email":"[^"]*"/g, '"email":"…"')
    console.error(`[diagnóstico Brevo] clave: ${shape} | /v3/account: ${res.status} ${account}`)
  } catch (e) {
    console.error(`[diagnóstico Brevo] clave: ${shape} | /v3/account: EXCEPCIÓN ${String(e)}`)
  }
}
