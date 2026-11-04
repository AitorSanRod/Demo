/** Lo que Cloudflare le da al Worker (ver wrangler.jsonc) */
export interface Env {
  /** La web compilada (dist/) */
  ASSETS: Fetcher
  DB: D1Database
  /** Clave de la API de Brevo para mandar los correos de las cuentas (secreto); sin ella, se escriben en el registro */
  BREVO_API_KEY?: string
  /** Email del remitente de los correos, verificado en Brevo (secreto) */
  MAIL_FROM?: string
}
