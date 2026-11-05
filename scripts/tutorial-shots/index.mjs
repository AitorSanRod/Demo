/**
 * Capturas de los tutoriales (menú del rancho › Tutoriales) en src/assets/tutorials/<nombre>.webp.
 *
 *   npm run dev                       # en otra terminal
 *   npm run shots                     # todas
 *   npm run shots -- raid             # solo las que empiezan por «raid»
 *
 * Variables: APP_URL (por defecto http://localhost:5173/) y CHROME_PATH (Chrome o Edge instalado).
 */
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
import { buildDemoSave } from './demoSave.mjs'
import { SHOTS } from './shots.mjs'

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173/'
const CHROME_PATH = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const OUT_DIR = fileURLToPath(new URL('../../src/assets/tutorials/', import.meta.url))
/** Móvil en vertical, como el que usa el juego */
const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 1 }
/** Calidad WebP (0–100): las capturas se ven pequeñas, así que basta con poca */
const QUALITY = 72
/** Lo que se tarda en cargar la app antes de empezar los pasos de una captura */
const LOAD_MS = 2500

/** Oculta lo que solo sale en desarrollo y los avisos que taparían la captura */
const CLEAN_CSS = '.time-chip { display: none !important; }'

const filter = process.argv[2] ?? ''
mkdirSync(OUT_DIR, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true })

for (const shot of SHOTS.filter((s) => s.name.startsWith(filter))) {
  const page = await browser.newPage()
  await page.setViewport(VIEWPORT)
  await page.goto(APP_URL)
  const save = await page.evaluate(buildDemoSave, shot.scenario ?? {})
  await page.evaluateOnNewDocument((data) => {
    if (sessionStorage.getItem('tutorial-shot')) return
    localStorage.clear()
    localStorage.setItem('pokerancho-save', data)
    sessionStorage.setItem('tutorial-shot', '1')
  }, save)
  await page.reload()
  await page.addStyleTag({ content: CLEAN_CSS })
  await wait(LOAD_MS)
  try {
    await shot.steps?.(page)
    if (shot.focus) await spotlight(page, shot.focus)
    await page.screenshot({ path: `${OUT_DIR}${shot.name}.webp`, type: 'webp', quality: QUALITY })
    console.log(`ok   ${shot.name}`)
  } catch (error) {
    console.log(`FAIL ${shot.name}: ${error.message}`)
  }
  await page.close()
}
await browser.close()

/** Oscurece todo menos el elemento y lo rodea con un anillo amarillo */
async function spotlight(page, selector) {
  const found = await page.waitForSelector(selector, { timeout: 4000 })
  // Buscando por texto sale el trozo de texto: se resalta el botón entero que lo contiene
  const el = (await found.evaluateHandle((node) => node.closest('button') ?? node)).asElement()
  await el.evaluate((node) => node.scrollIntoView({ block: 'center' }))
  await wait(400)
  const box = await el.boundingBox()
  await page.evaluate((b) => {
    const pad = 6
    const ring = document.createElement('div')
    Object.assign(ring.style, {
      position: 'fixed',
      left: `${b.x - pad}px`,
      top: `${b.y - pad}px`,
      width: `${b.width + pad * 2}px`,
      height: `${b.height + pad * 2}px`,
      border: '4px solid #ffd400',
      borderRadius: '14px',
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55), 0 0 18px 4px #ffd400',
      zIndex: '2147483647',
      pointerEvents: 'none',
    })
    document.body.append(ring)
  }, box)
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
