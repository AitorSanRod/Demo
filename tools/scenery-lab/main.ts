// Banco de pruebas de fondos: genera la escena elegida (código de src/ui/route/pixelScene) y la anima con controles.

import { PARTICLES_ID, SceneRenderer } from '../../src/ui/route/pixelScene/engine/renderer'
import type { SceneDef } from '../../src/ui/route/pixelScene/engine/types'
import { forestScene } from '../../src/ui/route/pixelScene/scenes/forest'
import { meadowScene } from '../../src/ui/route/pixelScene/scenes/meadow'
import { palletTownScene } from '../../src/ui/route/pixelScene/scenes/palletTown'

/** Píxeles de pantalla por píxel de arte */
const PIXEL = 3
/** Segundos entre paradas con «Una parada cada 12 s» activado */
const AUTO_LANDMARK_SECONDS = 12

/** Escenas en pruebas; el código vive en src/ui/route/pixelScene (el mismo que usa el juego) */
const SCENES: Record<string, (seed: number) => SceneDef> = {
  'Bosque Verde': forestScene,
  'Pueblo Paleta': palletTownScene,
  'Prado (Ruta 1)': meadowScene,
}
const VIEWPORTS: Record<string, [number, number]> = {
  'Móvil (390×720)': [390, 720],
  'Móvil pequeño (360×560)': [360, 560],
  'Ancho (960×540)': [960, 540],
}
const SPECIES: Record<string, number> = { Charmander: 4, Pidgey: 16, Pikachu: 25, Onix: 95 }

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const stage = $<HTMLDivElement>('stage')
const sceneSelect = $<HTMLSelectElement>('scene')
const viewportSelect = $<HTMLSelectElement>('viewport')
const speciesSelect = $<HTMLSelectElement>('species')
const seedInput = $<HTMLInputElement>('seed')
const speedInput = $<HTMLInputElement>('speed')
const walkButton = $<HTMLButtonElement>('walk')
const autoLandmark = $<HTMLInputElement>('auto-landmark')
const layersBox = $<HTMLFieldSetElement>('layers')

const fill = (select: HTMLSelectElement, options: string[]) => select.replaceChildren(...options.map((o) => new Option(o, o)))
fill(sceneSelect, Object.keys(SCENES))
fill(viewportSelect, Object.keys(VIEWPORTS))
fill(speciesSelect, Object.keys(SPECIES))

let scene: SceneDef
let renderer: SceneRenderer
let sinceLandmark = 0
let nextLandmark = 0

function build() {
  const hidden = renderer?.hidden ?? new Set<string>()
  scene = SCENES[sceneSelect.value](Number(seedInput.value) || 1)
  renderer = new SceneRenderer(scene, $('back'), $('front'))
  for (const id of hidden) renderer.hidden.add(id)
  renderer.speed = Number(speedInput.value)
  renderer.moving = walkButton.textContent === 'Parar'
  $('walker').style.bottom = `${scene.walkerBottom * PIXEL}px`
  buildLayerToggles()
  buildLandmarkButtons()
  resize()
}

function buildLayerToggles() {
  const entries = [...scene.layers.map((l) => [l.id, l.label]), [PARTICLES_ID, 'Partículas']]
  const toggles = entries.map(([id, label]) => {
    const box = document.createElement('input')
    box.type = 'checkbox'
    box.checked = !renderer.hidden.has(id)
    box.onchange = () => (box.checked ? renderer.hidden.delete(id) : renderer.hidden.add(id))
    const row = document.createElement('label')
    row.className = 'check'
    row.append(box, ` ${label}`)
    return row
  })
  layersBox.replaceChildren(layersBox.querySelector('legend')!, ...toggles)
}

function buildLandmarkButtons() {
  const buttons = scene.landmarks.map((landmark) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = `Parada: ${landmark.label}`
    button.onclick = () => renderer.spawnLandmark(landmark.id)
    return button
  })
  $('landmarks').replaceChildren(...buttons)
}

/** Con «Una parada cada 12 s» se van alternando las paradas de la escena */
function spawnNextLandmark() {
  if (scene.landmarks.length === 0) return
  renderer.spawnLandmark(scene.landmarks[nextLandmark++ % scene.landmarks.length].id)
}

function resize() {
  const [width, height] = VIEWPORTS[viewportSelect.value]
  stage.style.width = `${width}px`
  stage.style.height = `${height}px`
  renderer.resize(Math.ceil(width / PIXEL), Math.ceil(height / PIXEL))
}

function setWalking(walking: boolean) {
  renderer.moving = walking
  walkButton.textContent = walking ? 'Parar' : 'Caminar'
  stage.classList.toggle('paused', !walking)
}

function exportLayers() {
  for (const layer of scene.layers)
    layer.frames.forEach((frame, i) => {
      const link = document.createElement('a')
      link.download = `${layer.id}${layer.frames.length > 1 ? `-${i + 1}` : ''}.png`
      link.href = frame.toCanvas().toDataURL('image/png')
      link.click()
    })
}

/** Mismo sprite y escala que el juego (GIF de Blanco y Negro, lienzo de 96 px mostrado a 128) */
function showSpecies() {
  const img = $<HTMLImageElement>('walker-img')
  img.onload = () => {
    img.style.width = `${(img.naturalWidth * 128) / 96}px`
    img.style.height = `${(img.naturalHeight * 128) / 96}px`
  }
  const id = SPECIES[speciesSelect.value]
  img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`
}

sceneSelect.onchange = build
seedInput.onchange = build
$('reseed').onclick = () => {
  seedInput.value = String(Math.floor(Math.random() * 9999) + 1)
  build()
}
viewportSelect.onchange = resize
speciesSelect.onchange = showSpecies
speedInput.oninput = () => {
  renderer.speed = Number(speedInput.value)
  $('speed-out').textContent = `×${speedInput.value}`
}
walkButton.onclick = () => setWalking(!renderer.moving)
$('export').onclick = exportLayers

let last = performance.now()
function frame(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000)
  last = now
  sinceLandmark += dt
  if (autoLandmark.checked && sinceLandmark > AUTO_LANDMARK_SECONDS && renderer.moving) {
    spawnNextLandmark()
    sinceLandmark = 0
  }
  renderer.update(dt)
  renderer.draw()
  requestAnimationFrame(frame)
}

build()
showSpecies()
requestAnimationFrame(frame)
