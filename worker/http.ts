// Piezas comunes de las respuestas de la API

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } })

/**
 * La petición viene de la propia web. La cookie de sesión viaja sola en cada petición: sin esta comprobación, otra
 * web podría hacer peticiones en nombre del jugador
 */
export const sameOrigin = (request: Request): boolean => request.headers.get('Origin') === new URL(request.url).origin

/** El cuerpo JSON si cabe en `maxBytes` y se puede leer; si no, null */
export async function readJson(request: Request, maxBytes: number): Promise<unknown> {
  const text = await request.text()
  if (new TextEncoder().encode(text).length > maxBytes) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
