/**
 * Lista de capturas de los tutoriales. Cada una: `name` (fichero .webp), `scenario` (qué añadir a la partida de
 * demostración, ver demoSave.mjs), `steps` (toques hasta llegar a la pantalla) y `focus` (lo que se resalta).
 */
const NAV = { route: 1, gacha: 2, ranch: 3, shop: 4, dex: 5 }

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function tap(page, selector, after = 600) {
  const el = await page.waitForSelector(selector, { timeout: 4000 })
  await el.click()
  await wait(after)
}

const nav = (page, tab) => tap(page, `.bottom-nav button:nth-child(${NAV[tab]})`)

/** Abre la ficha del Pokémon del rancho de esa especie (por su clave de POKEMON, p. ej. 'Bulbasaur') */
async function openRanchMon(page, name) {
  const index = await page.evaluate(async (key) => {
    const { POKEMON } = await import('/src/data/pokemon.ts')
    const isSprite = (img) => img.src.endsWith(`/${POKEMON[key]}.png`) || img.src.endsWith(`/${POKEMON[key]}.gif`)
    return [...document.querySelectorAll('.ranch-mon')].findIndex((el) => [...el.querySelectorAll('img')].some(isSprite))
  }, name)
  if (index < 0) throw new Error(`${name} no está en el rancho`)
  await (await page.$$('.ranch-mon'))[index].click()
  await wait(900)
}

/** Lleva arriba una sección de la ficha por su título */
async function showSection(page, title) {
  const el = await page.waitForSelector(`::-p-text(${title})`, { timeout: 4000 })
  await el.evaluate((node) => node.scrollIntoView({ block: 'start' }))
  await wait(500)
}

/** Toca la escena de la ruta hasta que empieza un combate y deja que se vean unos golpes */
async function tapUntilBattle(page) {
  for (let i = 0; i < 200 && !(await page.$('.route-battle')); i++) {
    await page.mouse.click(195, 500)
    await wait(100)
  }
  await wait(2600)
}

const toRoute = (p) => nav(p, 'route')
const toRouteTab = async (p, label, after) => {
  await toRoute(p)
  await tap(p, `::-p-aria(${label})`, after)
}
const openMenu = async (p, entry) => {
  await tap(p, '.ranch-menu-button')
  await tap(p, `::-p-text(${entry})`)
}
const routeBattle = async (p) => {
  await toRoute(p)
  await tapUntilBattle(p)
}

export const SHOTS = [
  // Cómo jugar
  { name: 'play-ranch', focus: '.ranch-mon' },
  { name: 'play-companion', steps: (p) => openRanchMon(p, 'Eevee'), focus: '.companion-button' },
  { name: 'play-routes', steps: toRoute, focus: '.route-row:nth-child(2)' },
  {
    name: 'play-start',
    steps: async (p) => {
      await toRoute(p)
      await tap(p, '.route-row:nth-child(2)')
    },
    focus: '::-p-text(¡En marcha!)',
  },
  { name: 'play-run', scenario: { run: true }, steps: routeBattle },
  { name: 'play-expeditions', scenario: { expedition: true }, steps: (p) => toRouteTab(p, 'Expediciones'), focus: '::-p-aria(Expediciones)' },
  { name: 'play-gacha', steps: (p) => nav(p, 'gacha'), focus: '::-p-text(Tirar x1)' },
  { name: 'play-dex', steps: (p) => nav(p, 'dex'), focus: '.dex-cell.ready' },
  // Raids
  { name: 'raid-tab', steps: toRoute, focus: '::-p-aria(Raids)' },
  { name: 'raid-join', steps: (p) => toRouteTab(p, 'Raids', 1500), focus: '.mon-picker' },
  { name: 'raid-send', steps: (p) => toRouteTab(p, 'Raids', 1500), focus: '::-p-text(Mandar a )' },
  {
    name: 'raid-nickname',
    steps: async (p) => {
      await toRouteTab(p, 'Raids', 1500)
      await tap(p, '::-p-text(Mandar a )')
    },
  },
  { name: 'raid-battle', scenario: { raid: true }, steps: (p) => toRouteTab(p, 'Raids', 3000), focus: '::-p-text(Caerá en)' },
  { name: 'raid-prize', scenario: { raidPrize: true }, steps: (p) => toRouteTab(p, 'Raids', 1500), focus: '::-p-text(Recoger premio)' },
  // Evolucionar y mejorar
  {
    name: 'evo-train',
    steps: async (p) => {
      await openRanchMon(p, 'Charmander')
      await showSection(p, 'Cuidados')
    },
    focus: '.stepper-action',
  },
  {
    name: 'evo-evolve',
    steps: async (p) => {
      await openRanchMon(p, 'Bulbasaur')
      await showSection(p, 'Evolución')
    },
    focus: '.evolve-options',
  },
  {
    name: 'evo-stones',
    steps: async (p) => {
      await nav(p, 'shop')
      await tap(p, '::-p-text(Piedras evolutivas)')
    },
    focus: '.shop-fold-stones .shop-grid',
  },
  {
    name: 'evo-star',
    steps: async (p) => {
      await nav(p, 'dex')
      await tap(p, '.dex-cell.ready', 900)
      await showSection(p, 'Tickets')
    },
    focus: '::-p-text(Combinar: +1)',
  },
  { name: 'evo-passives', steps: (p) => tap(p, '.ranch-passive-count', 900) },
  { name: 'evo-bag', steps: (p) => openMenu(p, 'Mochila'), focus: '.bag-group' },
  // Ganar dinero
  { name: 'money-run', scenario: { run: true }, steps: routeBattle, focus: '.top-bar .currency' },
  { name: 'money-routes', steps: toRoute, focus: '.route-row:nth-child(4)' },
  {
    name: 'money-expedition',
    steps: async (p) => {
      await toRouteTab(p, 'Expediciones')
      await tap(p, '.route-list .route-row.tappable')
    },
    focus: '.route-start .segmented',
  },
  { name: 'money-gift', steps: (p) => openMenu(p, 'Obsequio diario'), focus: '.gift-days' },
]
